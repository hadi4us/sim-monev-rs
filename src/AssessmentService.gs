function getSelfAssessmentDashboard(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    assertSelfAssessmentAccess_(user);

    const activePeriod = getActivePeriod_();

    if (!activePeriod) {
      return jsonError_('Belum ada periode aktif.');
    }

    const targetRs = resolveSelfAssessmentRs_(user, payload.rs_id);

    if (!targetRs) {
      return jsonError_('Rumah sakit user tidak ditemukan atau tidak aktif.');
    }

    const assessment = getOrCreateAssessmentHeader_(
      activePeriod.periode_id,
      targetRs.rs_id,
      user.email
    );

    const instruments = getSelfAssessmentInstrumentList_(
      activePeriod.periode_id,
      user
    );

    const instrumentProgress = instruments.map(function (instrument) {
      return buildSelfAssessmentInstrumentProgress_(
        assessment.assessment_id,
        targetRs.rs_id,
        instrument
      );
    });

    return jsonSuccess_({
      currentUser: user,
      activePeriod: activePeriod,
      hospital: targetRs,
      assessment: assessment,
      instruments: instrumentProgress,
      hospitalOptions: getSelfAssessmentHospitalOptions_(user)
    }, 'Dashboard self assessment berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getSelfAssessmentForm(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    assertSelfAssessmentAccess_(user);

    const instrumenId = normalizeText_(payload.instrumen_id);

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    const activePeriod = getActivePeriod_();

    if (!activePeriod) {
      return jsonError_('Belum ada periode aktif.');
    }

    const targetRs = resolveSelfAssessmentRs_(user, payload.rs_id);

    if (!targetRs) {
      return jsonError_('Rumah sakit user tidak ditemukan atau tidak aktif.');
    }

    const assessment = getOrCreateAssessmentHeader_(
      activePeriod.periode_id,
      targetRs.rs_id,
      user.email
    );

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

    const instrumentRaw = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId
    );

    if (!instrumentRaw) {
      return jsonError_('Instrumen tidak ditemukan.');
    }

    const instrument = sanitizeInstrument_(instrumentRaw);

    if (instrument.periode_id !== activePeriod.periode_id) {
      return jsonError_('Instrumen tidak sesuai dengan periode aktif.');
    }

    if (
      instrument.status !== 'aktif' &&
      instrument.status !== 'terkunci'
    ) {
      return jsonError_('Instrumen belum aktif untuk self assessment.');
    }

    if (!canAccessSelfAssessmentUnit_(user, instrument.unit_id)) {
      return jsonError_('Anda tidak memiliki akses ke unit instrumen ini.');
    }

    const categories = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_KATEGORI
    )
      .map(sanitizeInstrumentCategory_)
      .filter(function (row) {
        return row.instrumen_id === instrumenId &&
          isActiveStatus_(row.status);
      })
      .sort(function (a, b) {
        return a.urutan - b.urutan;
      });

    const questions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PERTANYAAN
    )
      .map(sanitizeQuestion_)
      .filter(function (row) {
        return row.instrumen_id === instrumenId &&
          isActiveStatus_(row.status);
      })
      .sort(function (a, b) {
        return a.urutan - b.urutan;
      });

    const questionIds = questions.map(function (row) {
      return row.question_id;
    });

    const answerOptions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PILIHAN_JAWABAN
    )
      .map(sanitizeAnswerOption_)
      .filter(function (row) {
        return questionIds.indexOf(row.question_id) !== -1 &&
          isActiveStatus_(row.status);
      })
      .sort(function (a, b) {
        return a.urutan - b.urutan;
      });

    const existingAnswers = getExistingSelfAnswers_(
      assessment.assessment_id,
      targetRs.rs_id
    );

    const categoryBlocks = categories.map(function (category) {
      const categoryQuestions = questions
        .filter(function (question) {
          return question.kategori === category.kategori_id;
        })
        .map(function (question) {
          const options = answerOptions.filter(function (option) {
            return option.question_id === question.question_id;
          });

          const existingAnswer = existingAnswers.find(function (answer) {
            return answer.question_id === question.question_id;
          }) || null;

          return Object.assign({}, question, {
            answerOptions: options,
            existingAnswer: existingAnswer
          });
        });

      return Object.assign({}, category, {
        questions: categoryQuestions
      });
    });

    const uncategorizedQuestions = questions
      .filter(function (question) {
        return !categories.some(function (category) {
          return category.kategori_id === question.kategori;
        });
      })
      .map(function (question) {
        const options = answerOptions.filter(function (option) {
          return option.question_id === question.question_id;
        });

        const existingAnswer = existingAnswers.find(function (answer) {
          return answer.question_id === question.question_id;
        }) || null;

        return Object.assign({}, question, {
          answerOptions: options,
          existingAnswer: existingAnswer
        });
      });

    return jsonSuccess_({
      currentUser: user,
      activePeriod: activePeriod,
      hospital: targetRs,
      assessment: assessment,
      instrument: instrument,
      unit: getUnitById_(instrument.unit_id),
      categories: categoryBlocks,
      uncategorizedQuestions: uncategorizedQuestions,
      existingAnswers: existingAnswers,
      isReadOnly: isSelfAssessmentReadOnly_(assessment)
    }, 'Form self assessment berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function assertSelfAssessmentAccess_(user) {
  const allowedRoles = [
    'SUPER_ADMIN',
    'KOORDINATOR_MONEV',
    'ADMIN_RS',
    'OPERATOR_RS',
    'REVIEWER_RS',
    'VIEWER_RS'
  ];

  if (allowedRoles.indexOf(user.role) === -1) {
    throw new Error('Anda tidak memiliki akses ke modul Self Assessment RS.');
  }

  return true;
}

function canAccessSelfAssessmentUnit_(user, unitId) {
  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'KOORDINATOR_MONEV' ||
    user.role === 'ADMIN_RS' ||
    user.role === 'REVIEWER_RS' ||
    user.role === 'VIEWER_RS'
  ) {
    return true;
  }

  if (user.role === 'OPERATOR_RS') {
    if (!user.unit_id) {
      return true;
    }

    return normalizeText_(user.unit_id) === normalizeText_(unitId);
  }

  return false;
}

function resolveSelfAssessmentRs_(user, requestedRsId) {
  const hospitals = getActiveHospitals_();

  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'KOORDINATOR_MONEV'
  ) {
    const rsId = normalizeText_(requestedRsId);

    if (rsId) {
      return hospitals.find(function (rs) {
        return rs.rs_id === rsId;
      }) || null;
    }

    return hospitals[0] || null;
  }

  if (!user.rs_id) {
    return null;
  }

  return hospitals.find(function (rs) {
    return rs.rs_id === user.rs_id;
  }) || null;
}

function getSelfAssessmentHospitalOptions_(user) {
  if (
    user.role !== 'SUPER_ADMIN' &&
    user.role !== 'KOORDINATOR_MONEV'
  ) {
    return [];
  }

  return getActiveHospitals_();
}

function getSelfAssessmentInstrumentList_(periodeId, user) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  const instruments = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_HEADER
  )
    .map(sanitizeInstrument_)
    .filter(function (row) {
      const isPeriodMatch = row.periode_id === periodeId;
      const isPublished = row.status === 'aktif' || row.status === 'terkunci';
      const isUnitAllowed = canAccessSelfAssessmentUnit_(user, row.unit_id);

      return isPeriodMatch && isPublished && isUnitAllowed;
    })
    .sort(function (a, b) {
      return a.unit_id.localeCompare(b.unit_id) ||
        a.nama_instrumen.localeCompare(b.nama_instrumen);
    });

  return instruments;
}

function buildSelfAssessmentInstrumentProgress_(assessmentId, rsId, instrument) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
  const dbAssessmentId = getDbSpreadsheetId_('ASSESSMENT');

  const questions = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.PERTANYAAN
  )
    .map(sanitizeQuestion_)
    .filter(function (row) {
      return row.instrumen_id === instrument.instrumen_id &&
        isActiveStatus_(row.status);
    });

  const questionIds = questions.map(function (row) {
    return row.question_id;
  });

  const answers = readTable_(
    dbAssessmentId,
    CONFIG.SHEETS.JAWABAN_SELF
  )
    .filter(function (row) {
      return normalizeText_(row.assessment_id) === assessmentId &&
        normalizeText_(row.rs_id) === rsId &&
        questionIds.indexOf(normalizeText_(row.question_id)) !== -1 &&
        normalizeText_(row.answer_id);
    });

  const answeredQuestionIds = {};

  answers.forEach(function (answer) {
    const questionId = normalizeText_(answer.question_id);

    if (questionId) {
      answeredQuestionIds[questionId] = true;
    }
  });

  const answeredCount = Object.keys(answeredQuestionIds).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions === 0
    ? 0
    : Math.round((answeredCount / totalQuestions) * 100);

  const requiredEvidenceCount = questions.filter(function (q) {
    return normalizeText_(q.wajib_bukti) === 'ya';
  }).length;

  return Object.assign({}, instrument, {
    unit: getUnitById_(instrument.unit_id),
    total_questions: totalQuestions,
    answered_questions: answeredCount,
    required_evidence_questions: requiredEvidenceCount,
    progress_percent: progress,
    status_pengisian: progress === 0
      ? 'belum_diisi'
      : progress >= 100
        ? 'lengkap'
        : 'draft'
  });
}

function getOrCreateAssessmentHeader_(periodeId, rsId, userEmail) {
  const dbAssessmentId = getDbSpreadsheetId_('ASSESSMENT');
  const sheetName = CONFIG.SHEETS.ASSESSMENT_HEADER;

  const headers = readTable_(
    dbAssessmentId,
    sheetName
  );

  const existing = headers.find(function (row) {
    return normalizeText_(row.periode_id) === normalizeText_(periodeId) &&
      normalizeText_(row.rs_id) === normalizeText_(rsId);
  });

  if (existing) {
    return sanitizeAssessmentHeader_(existing);
  }

  const newHeader = {
    assessment_id: generateId_('ASM'),
    periode_id: periodeId,
    rs_id: rsId,
    status_self: 'DRAFT',
    nilai_self: 0,
    status_verifikasi: 'BELUM_DIVERIFIKASI',
    nilai_akhir: 0,
    updated_at: now_()
  };

  appendRows_(
    dbAssessmentId,
    sheetName,
    [newHeader]
  );

  return sanitizeAssessmentHeader_(newHeader);
}

function sanitizeAssessmentHeader_(row) {
  return {
    assessment_id: normalizeText_(row.assessment_id),
    periode_id: normalizeText_(row.periode_id),
    rs_id: normalizeText_(row.rs_id),
    status_self: normalizeText_(row.status_self),
    nilai_self: Number(row.nilai_self || 0),
    status_verifikasi: normalizeText_(row.status_verifikasi),
    nilai_akhir: Number(row.nilai_akhir || 0),
    updated_at: formatDateForClient_(row.updated_at)
  };
}

function getExistingSelfAnswers_(assessmentId, rsId) {
  const dbAssessmentId = getDbSpreadsheetId_('ASSESSMENT');

  return readTable_(
    dbAssessmentId,
    CONFIG.SHEETS.JAWABAN_SELF
  )
    .filter(function (row) {
      return normalizeText_(row.assessment_id) === assessmentId &&
        normalizeText_(row.rs_id) === rsId;
    })
    .map(function (row) {
      return {
        self_answer_id: normalizeText_(row.self_answer_id),
        assessment_id: normalizeText_(row.assessment_id),
        rs_id: normalizeText_(row.rs_id),
        unit_id: normalizeText_(row.unit_id),
        question_id: normalizeText_(row.question_id),
        answer_id: normalizeText_(row.answer_id),
        nilai_jawaban: Number(row.nilai_jawaban || 0),
        bobot_pertanyaan: Number(row.bobot_pertanyaan || 0),
        skor: Number(row.skor || 0),
        catatan_rs: normalizeText_(row.catatan_rs),
        updated_by: normalizeEmail_(row.updated_by),
        updated_at: formatDateForClient_(row.updated_at)
      };
    });
}

function getUnitById_(unitId) {
  const units = getActiveAndInactiveUnits_();

  return units.find(function (unit) {
    return unit.unit_id === unitId;
  }) || {
    unit_id: unitId,
    nama_unit: unitId,
    bobot_unit: 0,
    urutan: 0,
    status: ''
  };
}

function isSelfAssessmentReadOnly_(assessment) {
  const status = normalizeText_(assessment.status_self);

  return status === 'SUBMIT_FINAL_RS' ||
    status === 'FINAL_SELF' ||
    status === 'TERKUNCI';
}

function saveSelfAssessmentDraft(payload) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    assertSelfAssessmentEditAccess_(user);

    const instrumenId = normalizeText_(payload.instrumen_id);
    const answers = Array.isArray(payload.answers) ? payload.answers : [];

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    if (answers.length === 0) {
      return jsonError_('Belum ada jawaban atau catatan yang dikirim.');
    }

    const activePeriod = getActivePeriod_();

    if (!activePeriod) {
      return jsonError_('Belum ada periode aktif.');
    }

    const targetRs = resolveSelfAssessmentRs_(user, payload.rs_id);

    if (!targetRs) {
      return jsonError_('Rumah sakit user tidak ditemukan atau tidak aktif.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const dbAssessmentId = getDbSpreadsheetId_('ASSESSMENT');

    const instrumentRaw = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId
    );

    if (!instrumentRaw) {
      return jsonError_('Instrumen tidak ditemukan.');
    }

    const instrument = sanitizeInstrument_(instrumentRaw);

    if (instrument.periode_id !== activePeriod.periode_id) {
      return jsonError_('Instrumen tidak sesuai dengan periode aktif.');
    }

    if (
      instrument.status !== 'aktif' &&
      instrument.status !== 'terkunci'
    ) {
      return jsonError_('Instrumen belum aktif untuk self assessment.');
    }

    if (!canAccessSelfAssessmentUnit_(user, instrument.unit_id)) {
      return jsonError_('Anda tidak memiliki akses ke unit instrumen ini.');
    }

    const assessment = getOrCreateAssessmentHeader_(
      activePeriod.periode_id,
      targetRs.rs_id,
      user.email
    );

    if (isSelfAssessmentReadOnly_(assessment)) {
      return jsonError_('Assessment sudah disubmit/final sehingga tidak dapat diedit.');
    }

    const questions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PERTANYAAN
    )
      .map(sanitizeQuestion_)
      .filter(function (row) {
        return row.instrumen_id === instrumenId &&
          isActiveStatus_(row.status);
      });

    const questionMap = {};
    const questionIds = [];

    questions.forEach(function (question) {
      questionMap[question.question_id] = question;
      questionIds.push(question.question_id);
    });

    const answerOptions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PILIHAN_JAWABAN
    )
      .map(sanitizeAnswerOption_)
      .filter(function (row) {
        return questionIds.indexOf(row.question_id) !== -1 &&
          isActiveStatus_(row.status);
      });

    const answerOptionMap = {};

    answerOptions.forEach(function (option) {
      answerOptionMap[option.answer_id] = option;
    });

    const existingAnswers = getExistingSelfAnswers_(
      assessment.assessment_id,
      targetRs.rs_id
    );

    const existingByQuestionId = {};

    existingAnswers.forEach(function (answer) {
      existingByQuestionId[answer.question_id] = answer;
    });

    const invalidItems = [];
    const rowsToUpsert = [];

    answers.forEach(function (item) {
      item = item || {};

      const questionId = normalizeText_(item.question_id);
      const answerId = normalizeText_(item.answer_id);
      const catatanRs = normalizeText_(item.catatan_rs);

      if (!questionId) {
        return;
      }

      const question = questionMap[questionId];

      if (!question) {
        invalidItems.push({
          question_id: questionId,
          message: 'Pertanyaan tidak ditemukan atau tidak aktif.'
        });
        return;
      }

      if (!answerId && !catatanRs) {
        return;
      }

      let nilaiJawaban = 0;

      if (answerId) {
        const option = answerOptionMap[answerId];

        if (!option) {
          invalidItems.push({
            question_id: questionId,
            answer_id: answerId,
            message: 'Pilihan jawaban tidak ditemukan atau tidak aktif.'
          });
          return;
        }

        if (option.question_id !== questionId) {
          invalidItems.push({
            question_id: questionId,
            answer_id: answerId,
            message: 'Pilihan jawaban tidak sesuai dengan pertanyaan.'
          });
          return;
        }

        nilaiJawaban = Number(option.nilai_jawaban || 0);
      }

      const bobotPertanyaan = Number(question.bobot_pertanyaan || 0);
      const skor = bobotPertanyaan * nilaiJawaban;

      const existing = existingByQuestionId[questionId];

      rowsToUpsert.push({
        self_answer_id: existing
          ? existing.self_answer_id
          : generateId_('SELF'),
        assessment_id: assessment.assessment_id,
        rs_id: targetRs.rs_id,
        unit_id: instrument.unit_id,
        question_id: questionId,
        answer_id: answerId,
        nilai_jawaban: nilaiJawaban,
        bobot_pertanyaan: bobotPertanyaan,
        skor: skor,
        catatan_rs: catatanRs,
        updated_by: user.email,
        updated_at: now_()
      });
    });

    if (invalidItems.length > 0) {
      return jsonError_(
        'Ada jawaban yang tidak valid.',
        {
          invalidItems: invalidItems
        }
      );
    }

    if (rowsToUpsert.length === 0) {
      return jsonError_('Belum ada jawaban atau catatan yang dipilih.');
    }

    const upsertResult = upsertSelfAnswerRows_(
      dbAssessmentId,
      rowsToUpsert
    );

    updateRowById_(
      dbAssessmentId,
      CONFIG.SHEETS.ASSESSMENT_HEADER,
      'assessment_id',
      assessment.assessment_id,
      {
        status_self: 'DRAFT',
        updated_at: now_()
      }
    );

    const progress = buildSelfAssessmentInstrumentProgress_(
      assessment.assessment_id,
      targetRs.rs_id,
      instrument
    );

    return jsonSuccess_({
      assessment_id: assessment.assessment_id,
      instrumen_id: instrumenId,
      saved_count: rowsToUpsert.length,
      created_count: upsertResult.created,
      updated_count: upsertResult.updated,
      progress: progress
    }, 'Draft self assessment berhasil disimpan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseErr) {
      // abaikan jika lock belum sempat didapat
    }
  }
}

function assertSelfAssessmentEditAccess_(user) {
  const allowedRoles = [
    'SUPER_ADMIN',
    'ADMIN_RS',
    'OPERATOR_RS'
  ];

  if (allowedRoles.indexOf(user.role) === -1) {
    throw new Error('Role Anda tidak memiliki akses untuk menyimpan self assessment.');
  }

  return true;
}

function upsertSelfAnswerRows_(spreadsheetId, rows) {
  const sheet = getSheet_(
    spreadsheetId,
    CONFIG.SHEETS.JAWABAN_SELF
  );

  const values = sheet.getDataRange().getValues();

  if (values.length === 0) {
    throw new Error('Header sheet JAWABAN_SELF tidak ditemukan.');
  }

  const headers = values[0].map(function (header) {
    return normalizeText_(header);
  });

  const idColIndex = headers.indexOf('self_answer_id');

  if (idColIndex === -1) {
    throw new Error('Kolom self_answer_id tidak ditemukan di JAWABAN_SELF.');
  }

  const existingRowById = {};

  for (let i = 1; i < values.length; i++) {
    const selfAnswerId = normalizeText_(values[i][idColIndex]);

    if (selfAnswerId) {
      existingRowById[selfAnswerId] = i + 1;
    }
  }

  let created = 0;
  let updated = 0;

  const rowsToAppend = [];

  rows.forEach(function (row) {
    const rowValues = headers.map(function (header) {
      return row[header] !== undefined ? row[header] : '';
    });

    const existingRowNumber = existingRowById[row.self_answer_id];

    if (existingRowNumber) {
      sheet
        .getRange(existingRowNumber, 1, 1, headers.length)
        .setValues([rowValues]);

      updated++;
    } else {
      rowsToAppend.push(rowValues);
      created++;
    }
  });

  if (rowsToAppend.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        headers.length
      )
      .setValues(rowsToAppend);
  }

  return {
    created: created,
    updated: updated
  };
}