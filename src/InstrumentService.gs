function getInstrumentBuilderBootstrap(authToken) {
  try {
    const user = requireCurrentUser_(authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV' &&
      user.role !== 'VERIFIKATOR'
    ) {
      return jsonError_('Anda tidak memiliki akses ke modul instrumen.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

    return jsonSuccess_({
      currentUser: user,
      periods: getActiveAndInactivePeriods_(),
      units: getActiveAndInactiveUnits_(),
      instruments: getInstrumentList_(),
      categories: readTable_(dbInstrumenId, CONFIG.SHEETS.INSTRUMEN_KATEGORI).map(sanitizeInstrumentCategory_),
      questions: readTable_(dbInstrumenId, CONFIG.SHEETS.PERTANYAAN).map(sanitizeQuestion_),
      answerOptions: readTable_(dbInstrumenId, CONFIG.SHEETS.PILIHAN_JAWABAN).map(sanitizeAnswerOption_)
    }, 'Bootstrap instrument builder berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getInstrumentList_() {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  const instruments = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_HEADER
  );

  return instruments
    .map(sanitizeInstrument_)
    .sort(function (a, b) {
      return a.unit_id.localeCompare(b.unit_id) ||
        a.nama_instrumen.localeCompare(b.nama_instrumen);
    });
}

function saveInstrument(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Hanya SUPER_ADMIN/KOORDINATOR_MONEV yang dapat menyimpan instrumen.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const sheetName = CONFIG.SHEETS.INSTRUMEN_HEADER;

    const instrumenId = normalizeText_(payload.instrumen_id);

    const data = {
      instrumen_id: instrumenId || generateId_('INS'),
      periode_id: normalizeText_(payload.periode_id),
      unit_id: normalizeText_(payload.unit_id),
      nama_instrumen: normalizeText_(payload.nama_instrumen),
      versi: Number(payload.versi || 1),
      status: normalizeStatus_(payload.status || 'draft')
    };

    if (!data.periode_id) {
      return jsonError_('Periode wajib dipilih.');
    }

    if (!data.unit_id) {
      return jsonError_('Unit kerja wajib dipilih.');
    }

    if (!data.nama_instrumen) {
      return jsonError_('Nama instrumen wajib diisi.');
    }

    if (instrumenId) {
      const existing = findRowById_(
        dbInstrumenId,
        sheetName,
        'instrumen_id',
        instrumenId
      );

      if (!existing) {
        return jsonError_('Instrumen tidak ditemukan.');
      }

      if (normalizeStatus_(existing.status) === 'terkunci') {
        return jsonError_('Instrumen terkunci tidak dapat diedit.');
      }

      const updated = updateRowById_(
        dbInstrumenId,
        sheetName,
        'instrumen_id',
        instrumenId,
        data
      );

      return jsonSuccess_({
        instrument: sanitizeInstrument_(updated)
      }, 'Instrumen berhasil diperbarui.');
    }

    appendRows_(dbInstrumenId, sheetName, [data]);

    appendInstrumentVersionLog_({
      instrumen_id: data.instrumen_id,
      versi: data.versi,
      catatan_perubahan: 'Membuat instrumen baru',
      created_by: user.email
    });

    return jsonSuccess_({
      instrument: data
    }, 'Instrumen berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function saveInstrumentCategory(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Anda tidak memiliki akses menyimpan kategori instrumen.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const sheetName = CONFIG.SHEETS.INSTRUMEN_KATEGORI;

    const kategoriId = normalizeText_(payload.kategori_id);

    const data = {
      kategori_id: kategoriId || generateId_('KAT'),
      instrumen_id: normalizeText_(payload.instrumen_id),
      unit_id: normalizeText_(payload.unit_id),
      nama_kategori: normalizeText_(payload.nama_kategori),
      urutan: Number(payload.urutan || 0),
      status: normalizeStatus_(payload.status || 'aktif')
    };

    if (!data.instrumen_id) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    if (!data.unit_id) {
      return jsonError_('Unit kerja wajib dipilih.');
    }

    if (!data.nama_kategori) {
      return jsonError_('Nama kategori wajib diisi.');
    }

    assertInstrumentEditable_(data.instrumen_id);

    if (kategoriId) {
      const existing = findRowById_(
        dbInstrumenId,
        sheetName,
        'kategori_id',
        kategoriId
      );

      if (!existing) {
        return jsonError_('Kategori tidak ditemukan.');
      }

      const updated = updateRowById_(
        dbInstrumenId,
        sheetName,
        'kategori_id',
        kategoriId,
        data
      );

      return jsonSuccess_({
        category: sanitizeInstrumentCategory_(updated)
      }, 'Kategori berhasil diperbarui.');
    }

    appendRows_(dbInstrumenId, sheetName, [data]);

    return jsonSuccess_({
      category: data
    }, 'Kategori berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function saveQuestion(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Anda tidak memiliki akses menyimpan pertanyaan.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const sheetName = CONFIG.SHEETS.PERTANYAAN;

    const questionId = normalizeText_(payload.question_id);

    const data = {
      question_id: questionId || generateId_('Q'),
      instrumen_id: normalizeText_(payload.instrumen_id),
      unit_id: normalizeText_(payload.unit_id),
      kategori: normalizeText_(payload.kategori),
      pertanyaan: normalizeText_(payload.pertanyaan),
      tipe_jawaban: normalizeText_(payload.tipe_jawaban || 'pilihan_ganda'),
      bobot_pertanyaan: Number(payload.bobot_pertanyaan || 0),
      wajib_bukti: normalizeText_(payload.wajib_bukti || 'tidak'),
      keterangan_bukti: normalizeText_(payload.keterangan_bukti),
      urutan: Number(payload.urutan || 0),
      status: normalizeStatus_(payload.status || 'aktif')
    };

    if (!data.instrumen_id) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    if (!data.unit_id) {
      return jsonError_('Unit kerja wajib dipilih.');
    }

    if (!data.kategori) {
      return jsonError_('Kategori wajib dipilih.');
    }

    if (!data.pertanyaan) {
      return jsonError_('Pertanyaan wajib diisi.');
    }

    if (data.bobot_pertanyaan < 0) {
      return jsonError_('Bobot pertanyaan tidak boleh negatif.');
    }

    assertInstrumentEditable_(data.instrumen_id);

    if (questionId) {
      const existing = findRowById_(
        dbInstrumenId,
        sheetName,
        'question_id',
        questionId
      );

      if (!existing) {
        return jsonError_('Pertanyaan tidak ditemukan.');
      }

      const updated = updateRowById_(
        dbInstrumenId,
        sheetName,
        'question_id',
        questionId,
        data
      );

      return jsonSuccess_({
        question: sanitizeQuestion_(updated)
      }, 'Pertanyaan berhasil diperbarui.');
    }

    appendRows_(dbInstrumenId, sheetName, [data]);

    return jsonSuccess_({
      question: data
    }, 'Pertanyaan berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function saveAnswerOption(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Anda tidak memiliki akses menyimpan pilihan jawaban.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const sheetName = CONFIG.SHEETS.PILIHAN_JAWABAN;

    const answerId = normalizeText_(payload.answer_id);
    const questionId = normalizeText_(payload.question_id);

    const question = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.PERTANYAAN,
      'question_id',
      questionId
    );

    if (!question) {
      return jsonError_('Pertanyaan tidak ditemukan.');
    }

    assertInstrumentEditable_(question.instrumen_id);

    const data = {
      answer_id: answerId || generateId_('ANS'),
      question_id: questionId,
      label_jawaban: normalizeText_(payload.label_jawaban),
      nilai_jawaban: Number(payload.nilai_jawaban || 0),
      urutan: Number(payload.urutan || 0),
      status: normalizeStatus_(payload.status || 'aktif')
    };

    if (!data.question_id) {
      return jsonError_('Pertanyaan wajib dipilih.');
    }

    if (!data.label_jawaban) {
      return jsonError_('Label jawaban wajib diisi.');
    }

    if (answerId) {
      const existing = findRowById_(
        dbInstrumenId,
        sheetName,
        'answer_id',
        answerId
      );

      if (!existing) {
        return jsonError_('Pilihan jawaban tidak ditemukan.');
      }

      const updated = updateRowById_(
        dbInstrumenId,
        sheetName,
        'answer_id',
        answerId,
        data
      );

      return jsonSuccess_({
        answerOption: sanitizeAnswerOption_(updated)
      }, 'Pilihan jawaban berhasil diperbarui.');
    }

    appendRows_(dbInstrumenId, sheetName, [data]);

    return jsonSuccess_({
      answerOption: data
    }, 'Pilihan jawaban berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function activateInstrument(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Anda tidak memiliki akses mengaktifkan instrumen.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const instrumenId = normalizeText_(payload.instrumen_id);

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    const instrument = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId
    );

    if (!instrument) {
      return jsonError_('Instrumen tidak ditemukan.');
    }

    if (normalizeStatus_(instrument.status) === 'terkunci') {
      return jsonError_('Instrumen sudah terkunci dan tidak dapat diaktifkan ulang.');
    }

    const preview = buildInstrumentPreview_(instrumenId);
    const validation = buildInstrumentValidation_(preview);

    if (!validation.is_valid) {
      return jsonError_(
        'Instrumen belum valid sehingga belum dapat diaktifkan.',
        {
          summary: preview.summary,
          validation: validation
        }
      );
    }

    updateRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId,
      {
        status: 'aktif'
      }
    );

    appendInstrumentVersionLog_({
      instrumen_id: instrumenId,
      versi: Number(instrument.versi || 1),
      catatan_perubahan: 'Mengaktifkan instrumen setelah validasi kelengkapan',
      created_by: user.email
    });

    return jsonSuccess_({
      validation: validation
    }, 'Instrumen berhasil diaktifkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function lockInstrument(payload) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (user.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat mengunci instrumen.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');
    const instrumenId = normalizeText_(payload.instrumen_id);

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    const instrument = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId
    );

    if (!instrument) {
      return jsonError_('Instrumen tidak ditemukan.');
    }

    if (normalizeStatus_(instrument.status) === 'terkunci') {
      return jsonSuccess_(null, 'Instrumen sudah dalam status terkunci.');
    }

    const preview = buildInstrumentPreview_(instrumenId);
    const validation = buildInstrumentValidation_(preview);

    if (!validation.is_valid) {
      return jsonError_(
        'Instrumen belum valid sehingga belum dapat dikunci.',
        {
          summary: preview.summary,
          validation: validation
        }
      );
    }

    updateRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      instrumenId,
      {
        status: 'terkunci'
      }
    );

    appendInstrumentVersionLog_({
      instrumen_id: instrumenId,
      versi: Number(instrument.versi || 1),
      catatan_perubahan: 'Mengunci instrumen setelah validasi kelengkapan',
      created_by: user.email
    });

    return jsonSuccess_({
      validation: validation
    }, 'Instrumen berhasil dikunci.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseErr) {
      // abaikan jika lock belum sempat didapatkan
    }
  }
}

function assertInstrumentEditable_(instrumenId) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  const instrument = findRowById_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_HEADER,
    'instrumen_id',
    instrumenId
  );

  if (!instrument) {
    throw new Error('Instrumen tidak ditemukan.');
  }

  const status = normalizeStatus_(instrument.status);

  if (status === 'terkunci') {
    throw new Error('Instrumen sudah terkunci dan tidak dapat diedit.');
  }

  return true;
}

function appendInstrumentVersionLog_(payload) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  appendRows_(
    dbInstrumenId,
    CONFIG.SHEETS.VERSI_INSTRUMEN,
    [
      {
        versi_id: generateId_('VERINS'),
        instrumen_id: normalizeText_(payload.instrumen_id),
        versi: Number(payload.versi || 1),
        catatan_perubahan: normalizeText_(payload.catatan_perubahan),
        created_by: normalizeEmail_(payload.created_by),
        created_at: now_()
      }
    ]
  );
}

function sanitizeInstrument_(row) {
  return {
    instrumen_id: normalizeText_(row.instrumen_id),
    periode_id: normalizeText_(row.periode_id),
    unit_id: normalizeText_(row.unit_id),
    nama_instrumen: normalizeText_(row.nama_instrumen),
    versi: Number(row.versi || 1),
    status: normalizeStatus_(row.status)
  };
}

function sanitizeInstrumentCategory_(row) {
  return {
    kategori_id: normalizeText_(row.kategori_id),
    instrumen_id: normalizeText_(row.instrumen_id),
    unit_id: normalizeText_(row.unit_id),
    nama_kategori: normalizeText_(row.nama_kategori),
    urutan: Number(row.urutan || 0),
    status: normalizeStatus_(row.status)
  };
}

function sanitizeQuestion_(row) {
  return {
    question_id: normalizeText_(row.question_id),
    instrumen_id: normalizeText_(row.instrumen_id),
    unit_id: normalizeText_(row.unit_id),
    kategori: normalizeText_(row.kategori),
    pertanyaan: normalizeText_(row.pertanyaan),
    tipe_jawaban: normalizeText_(row.tipe_jawaban),
    bobot_pertanyaan: Number(row.bobot_pertanyaan || 0),
    wajib_bukti: normalizeText_(row.wajib_bukti),
    keterangan_bukti: normalizeText_(row.keterangan_bukti),
    urutan: Number(row.urutan || 0),
    status: normalizeStatus_(row.status)
  };
}

function sanitizeAnswerOption_(row) {
  return {
    answer_id: normalizeText_(row.answer_id),
    question_id: normalizeText_(row.question_id),
    label_jawaban: normalizeText_(row.label_jawaban),
    nilai_jawaban: Number(row.nilai_jawaban || 0),
    urutan: Number(row.urutan || 0),
    status: normalizeStatus_(row.status)
  };
}

function getInstrumentPreview(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV' &&
      user.role !== 'VERIFIKATOR'
    ) {
      return jsonError_('Anda tidak memiliki akses melihat preview instrumen.');
    }

    const instrumenId = normalizeText_(payload.instrumen_id);

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    const preview = buildInstrumentPreview_(instrumenId);
    const validation = buildInstrumentValidation_(preview);

    return jsonSuccess_({
      preview: preview,
      validation: validation
    }, 'Preview instrumen berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function validateInstrumentCompleteness(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV' &&
      user.role !== 'VERIFIKATOR'
    ) {
      return jsonError_('Anda tidak memiliki akses melakukan validasi instrumen.');
    }

    const instrumenId = normalizeText_(payload.instrumen_id);

    if (!instrumenId) {
      return jsonError_('Instrumen wajib dipilih.');
    }

    const preview = buildInstrumentPreview_(instrumenId);
    const validation = buildInstrumentValidation_(preview);

    return jsonSuccess_({
      instrumen_id: instrumenId,
      summary: preview.summary,
      validation: validation
    }, validation.is_valid ? 'Instrumen valid.' : 'Instrumen belum valid.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function buildInstrumentPreview_(instrumenId) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  const instrumentRaw = findRowById_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_HEADER,
    'instrumen_id',
    instrumenId
  );

  if (!instrumentRaw) {
    throw new Error('Instrumen tidak ditemukan.');
  }

  const instrument = sanitizeInstrument_(instrumentRaw);

  const periods = getActiveAndInactivePeriods_();
  const units = getActiveAndInactiveUnits_();

  const period = periods.find(function (row) {
    return row.periode_id === instrument.periode_id;
  }) || null;

  const unit = units.find(function (row) {
    return row.unit_id === instrument.unit_id;
  }) || null;

  const categories = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_KATEGORI
  )
    .map(sanitizeInstrumentCategory_)
    .filter(function (row) {
      return row.instrumen_id === instrumenId;
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
      return row.instrumen_id === instrumenId;
    })
    .sort(function (a, b) {
      return a.urutan - b.urutan;
    });

  const answerOptions = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.PILIHAN_JAWABAN
  )
    .map(sanitizeAnswerOption_);

  const categoriesWithQuestions = categories.map(function (cat) {
    const catQuestions = questions
      .filter(function (q) {
        return q.kategori === cat.kategori_id;
      })
      .map(function (q) {
        const answers = answerOptions
          .filter(function (ans) {
            return ans.question_id === q.question_id;
          })
          .sort(function (a, b) {
            return a.urutan - b.urutan;
          });

        const activeAnswers = answers.filter(function (ans) {
          return isActiveStatus_(ans.status);
        });

        const maxNilai = activeAnswers.reduce(function (max, ans) {
          return Math.max(max, Number(ans.nilai_jawaban || 0));
        }, 0);

        return Object.assign({}, q, {
          answerOptions: answers,
          active_answer_count: activeAnswers.length,
          max_nilai_jawaban: maxNilai,
          skor_maksimal: Number(q.bobot_pertanyaan || 0) * maxNilai
        });
      });

    return Object.assign({}, cat, {
      questions: catQuestions
    });
  });

  const uncategorizedQuestions = questions
    .filter(function (q) {
      return !categories.some(function (cat) {
        return cat.kategori_id === q.kategori;
      });
    })
    .map(function (q) {
      const answers = answerOptions
        .filter(function (ans) {
          return ans.question_id === q.question_id;
        })
        .sort(function (a, b) {
          return a.urutan - b.urutan;
        });

      const activeAnswers = answers.filter(function (ans) {
        return isActiveStatus_(ans.status);
      });

      const maxNilai = activeAnswers.reduce(function (max, ans) {
        return Math.max(max, Number(ans.nilai_jawaban || 0));
      }, 0);

      return Object.assign({}, q, {
        answerOptions: answers,
        active_answer_count: activeAnswers.length,
        max_nilai_jawaban: maxNilai,
        skor_maksimal: Number(q.bobot_pertanyaan || 0) * maxNilai
      });
    });

  const activeCategories = categories.filter(function (cat) {
    return isActiveStatus_(cat.status);
  });

  const activeQuestions = questions.filter(function (q) {
    return isActiveStatus_(q.status);
  });

  const totalActiveAnswers = answerOptions.filter(function (ans) {
    return isActiveStatus_(ans.status) &&
      questions.some(function (q) {
        return q.question_id === ans.question_id;
      });
  }).length;

  const totalBobotAktif = activeQuestions.reduce(function (total, q) {
    return total + Number(q.bobot_pertanyaan || 0);
  }, 0);

  const totalSkorMaksimal = categoriesWithQuestions.reduce(function (totalCat, cat) {
    return totalCat + cat.questions.reduce(function (totalQ, q) {
      if (!isActiveStatus_(q.status)) {
        return totalQ;
      }

      return totalQ + Number(q.skor_maksimal || 0);
    }, 0);
  }, 0) + uncategorizedQuestions.reduce(function (totalQ, q) {
    if (!isActiveStatus_(q.status)) {
      return totalQ;
    }

    return totalQ + Number(q.skor_maksimal || 0);
  }, 0);

  return {
    instrument: instrument,
    period: period,
    unit: unit,
    categories: categoriesWithQuestions,
    uncategorizedQuestions: uncategorizedQuestions,
    summary: {
      total_kategori: categories.length,
      total_kategori_aktif: activeCategories.length,
      total_pertanyaan: questions.length,
      total_pertanyaan_aktif: activeQuestions.length,
      total_opsi_jawaban_aktif: totalActiveAnswers,
      total_bobot_aktif: totalBobotAktif,
      estimasi_skor_maksimal: totalSkorMaksimal
    }
  };
}

function buildInstrumentValidation_(preview) {
  const issues = [];

  const instrument = preview.instrument;
  const activeCategories = preview.categories.filter(function (cat) {
    return isActiveStatus_(cat.status);
  });

  const activeQuestions = [];

  preview.categories.forEach(function (cat) {
    cat.questions.forEach(function (q) {
      if (isActiveStatus_(q.status)) {
        activeQuestions.push(q);
      }
    });
  });

  preview.uncategorizedQuestions.forEach(function (q) {
    if (isActiveStatus_(q.status)) {
      activeQuestions.push(q);
    }
  });

  if (!preview.period) {
    pushValidationIssue_(issues, 'error', 'PERIODE_NOT_FOUND', 'Periode instrumen tidak ditemukan di MASTER_PERIODE.', 'instrument', instrument.instrumen_id);
  }

  if (!preview.unit) {
    pushValidationIssue_(issues, 'error', 'UNIT_NOT_FOUND', 'Unit kerja instrumen tidak ditemukan di MASTER_UNIT_KERJA.', 'instrument', instrument.instrumen_id);
  }

  if (activeCategories.length === 0) {
    pushValidationIssue_(issues, 'error', 'NO_ACTIVE_CATEGORY', 'Instrumen belum memiliki kategori aktif.', 'instrument', instrument.instrumen_id);
  }

  if (activeQuestions.length === 0) {
    pushValidationIssue_(issues, 'error', 'NO_ACTIVE_QUESTION', 'Instrumen belum memiliki pertanyaan aktif.', 'instrument', instrument.instrumen_id);
  }

  if (Number(preview.summary.total_bobot_aktif || 0) <= 0) {
    pushValidationIssue_(issues, 'error', 'TOTAL_WEIGHT_ZERO', 'Total bobot pertanyaan aktif masih 0.', 'instrument', instrument.instrumen_id);
  }

  preview.categories.forEach(function (cat) {
    if (!cat.nama_kategori) {
      pushValidationIssue_(issues, 'error', 'CATEGORY_NAME_EMPTY', 'Ada kategori tanpa nama.', 'category', cat.kategori_id);
    }

    const activeCatQuestions = cat.questions.filter(function (q) {
      return isActiveStatus_(q.status);
    });

    if (isActiveStatus_(cat.status) && activeCatQuestions.length === 0) {
      pushValidationIssue_(
        issues,
        'warning',
        'ACTIVE_CATEGORY_NO_QUESTION',
        'Kategori aktif belum memiliki pertanyaan aktif: ' + cat.nama_kategori,
        'category',
        cat.kategori_id
      );
    }
  });

  activeQuestions.forEach(function (q) {
    const categoryExists = preview.categories.some(function (cat) {
      return cat.kategori_id === q.kategori && isActiveStatus_(cat.status);
    });

    if (!categoryExists) {
      pushValidationIssue_(
        issues,
        'error',
        'QUESTION_CATEGORY_INVALID',
        'Pertanyaan aktif belum terkait kategori aktif: ' + q.pertanyaan,
        'question',
        q.question_id
      );
    }

    if (!q.pertanyaan) {
      pushValidationIssue_(issues, 'error', 'QUESTION_TEXT_EMPTY', 'Ada pertanyaan aktif tanpa teks pertanyaan.', 'question', q.question_id);
    }

    if (Number(q.bobot_pertanyaan || 0) <= 0) {
      pushValidationIssue_(
        issues,
        'error',
        'QUESTION_WEIGHT_ZERO',
        'Bobot pertanyaan aktif harus lebih dari 0: ' + q.pertanyaan,
        'question',
        q.question_id
      );
    }

    if (q.wajib_bukti === 'ya' && !q.keterangan_bukti) {
      pushValidationIssue_(
        issues,
        'warning',
        'EVIDENCE_NOTE_EMPTY',
        'Pertanyaan wajib bukti belum memiliki keterangan bukti: ' + q.pertanyaan,
        'question',
        q.question_id
      );
    }

    if (isChoiceQuestionType_(q.tipe_jawaban)) {
      const activeAnswers = (q.answerOptions || []).filter(function (ans) {
        return isActiveStatus_(ans.status);
      });

      if (activeAnswers.length < 2) {
        pushValidationIssue_(
          issues,
          'error',
          'CHOICE_ANSWER_LESS_THAN_TWO',
          'Pertanyaan pilihan minimal harus memiliki 2 opsi jawaban aktif: ' + q.pertanyaan,
          'question',
          q.question_id
        );
      }

      const maxNilai = activeAnswers.reduce(function (max, ans) {
        return Math.max(max, Number(ans.nilai_jawaban || 0));
      }, 0);

      if (maxNilai <= 0) {
        pushValidationIssue_(
          issues,
          'error',
          'CHOICE_MAX_SCORE_ZERO',
          'Pertanyaan pilihan harus memiliki minimal satu opsi dengan nilai lebih dari 0: ' + q.pertanyaan,
          'question',
          q.question_id
        );
      }

      activeAnswers.forEach(function (ans) {
        if (!ans.label_jawaban) {
          pushValidationIssue_(
            issues,
            'error',
            'ANSWER_LABEL_EMPTY',
            'Ada opsi jawaban aktif tanpa label pada pertanyaan: ' + q.pertanyaan,
            'answer',
            ans.answer_id
          );
        }
      });
    } else {
      if (Number(q.bobot_pertanyaan || 0) > 0) {
        pushValidationIssue_(
          issues,
          'error',
          'NON_CHOICE_SCORING_NOT_READY',
          'Tipe jawaban ' + q.tipe_jawaban + ' belum didukung untuk skoring otomatis. Gunakan pilihan_ganda/ya_tidak atau ubah bobot menjadi 0.',
          'question',
          q.question_id
        );
      }
    }
  });

  preview.uncategorizedQuestions.forEach(function (q) {
    if (isActiveStatus_(q.status)) {
      pushValidationIssue_(
        issues,
        'error',
        'UNCATEGORIZED_QUESTION',
        'Ada pertanyaan aktif yang tidak terkait kategori valid: ' + q.pertanyaan,
        'question',
        q.question_id
      );
    }
  });

  const errors = issues.filter(function (issue) {
    return issue.severity === 'error';
  });

  const warnings = issues.filter(function (issue) {
    return issue.severity === 'warning';
  });

  return {
    is_valid: errors.length === 0,
    error_count: errors.length,
    warning_count: warnings.length,
    issues: issues
  };
}

function pushValidationIssue_(issues, severity, code, message, objectType, objectId) {
  issues.push({
    severity: severity,
    code: code,
    message: message,
    object_type: objectType || '',
    object_id: objectId || ''
  });
}

function isChoiceQuestionType_(tipeJawaban) {
  const type = normalizeText_(tipeJawaban);

  return type === 'pilihan_ganda' || type === 'ya_tidak';
}

function cloneInstrumentVersion(payload) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV'
    ) {
      return jsonError_('Hanya SUPER_ADMIN/KOORDINATOR_MONEV yang dapat melakukan clone versi instrumen.');
    }

    const sourceInstrumenId = normalizeText_(payload.source_instrumen_id);

    if (!sourceInstrumenId) {
      return jsonError_('Instrumen sumber wajib dipilih.');
    }

    const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

    const sourceInstrumentRaw = findRowById_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      'instrumen_id',
      sourceInstrumenId
    );

    if (!sourceInstrumentRaw) {
      return jsonError_('Instrumen sumber tidak ditemukan.');
    }

    const sourceInstrument = sanitizeInstrument_(sourceInstrumentRaw);

    const targetInstrumenId = generateId_('INS');
    const targetPeriodeId = normalizeText_(payload.periode_id || sourceInstrument.periode_id);
    const targetUnitId = normalizeText_(payload.unit_id || sourceInstrument.unit_id);
    const targetNamaInstrumen = normalizeText_(payload.nama_instrumen || sourceInstrument.nama_instrumen);

    if (!targetPeriodeId) {
      return jsonError_('Periode target wajib dipilih.');
    }

    if (!targetUnitId) {
      return jsonError_('Unit kerja target wajib dipilih.');
    }

    if (!targetNamaInstrumen) {
      return jsonError_('Nama instrumen target wajib diisi.');
    }

    const requestedVersion = Number(payload.versi || 0);
    const defaultVersion = Number(sourceInstrument.versi || 1) + 1;
    const targetVersion = resolveCloneInstrumentVersion_(
      targetNamaInstrumen,
      targetPeriodeId,
      targetUnitId,
      requestedVersion || defaultVersion
    );

    const sourceCategories = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_KATEGORI
    )
      .map(sanitizeInstrumentCategory_)
      .filter(function (row) {
        return row.instrumen_id === sourceInstrumenId;
      });

    const sourceQuestions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PERTANYAAN
    )
      .map(sanitizeQuestion_)
      .filter(function (row) {
        return row.instrumen_id === sourceInstrumenId;
      });

    const sourceQuestionIds = sourceQuestions.map(function (row) {
      return row.question_id;
    });

    const sourceAnswerOptions = readTable_(
      dbInstrumenId,
      CONFIG.SHEETS.PILIHAN_JAWABAN
    )
      .map(sanitizeAnswerOption_)
      .filter(function (row) {
        return sourceQuestionIds.indexOf(row.question_id) !== -1;
      });

    const categoryIdMap = {};
    const questionIdMap = {};

    const newInstrument = {
      instrumen_id: targetInstrumenId,
      periode_id: targetPeriodeId,
      unit_id: targetUnitId,
      nama_instrumen: targetNamaInstrumen,
      versi: targetVersion,
      status: 'draft'
    };

    const newCategories = sourceCategories.map(function (cat) {
      const newKategoriId = generateId_('KAT');
      categoryIdMap[cat.kategori_id] = newKategoriId;

      return {
        kategori_id: newKategoriId,
        instrumen_id: targetInstrumenId,
        unit_id: targetUnitId,
        nama_kategori: cat.nama_kategori,
        urutan: cat.urutan,
        status: cat.status || 'aktif'
      };
    });

    const newQuestions = sourceQuestions.map(function (q) {
      const newQuestionId = generateId_('Q');
      questionIdMap[q.question_id] = newQuestionId;

      return {
        question_id: newQuestionId,
        instrumen_id: targetInstrumenId,
        unit_id: targetUnitId,
        kategori: categoryIdMap[q.kategori] || '',
        pertanyaan: q.pertanyaan,
        tipe_jawaban: q.tipe_jawaban || 'pilihan_ganda',
        bobot_pertanyaan: Number(q.bobot_pertanyaan || 0),
        wajib_bukti: q.wajib_bukti || 'tidak',
        keterangan_bukti: q.keterangan_bukti || '',
        urutan: Number(q.urutan || 0),
        status: q.status || 'aktif'
      };
    });

    const newAnswerOptions = sourceAnswerOptions
      .filter(function (ans) {
        return questionIdMap[ans.question_id];
      })
      .map(function (ans) {
        return {
          answer_id: generateId_('ANS'),
          question_id: questionIdMap[ans.question_id],
          label_jawaban: ans.label_jawaban,
          nilai_jawaban: Number(ans.nilai_jawaban || 0),
          urutan: Number(ans.urutan || 0),
          status: ans.status || 'aktif'
        };
      });

    appendRows_(
      dbInstrumenId,
      CONFIG.SHEETS.INSTRUMEN_HEADER,
      [newInstrument]
    );

    if (newCategories.length > 0) {
      appendRows_(
        dbInstrumenId,
        CONFIG.SHEETS.INSTRUMEN_KATEGORI,
        newCategories
      );
    }

    if (newQuestions.length > 0) {
      appendRows_(
        dbInstrumenId,
        CONFIG.SHEETS.PERTANYAAN,
        newQuestions
      );
    }

    if (newAnswerOptions.length > 0) {
      appendRows_(
        dbInstrumenId,
        CONFIG.SHEETS.PILIHAN_JAWABAN,
        newAnswerOptions
      );
    }

    appendInstrumentVersionLog_({
      instrumen_id: targetInstrumenId,
      versi: targetVersion,
      catatan_perubahan:
        normalizeText_(payload.catatan_perubahan) ||
        'Clone dari instrumen ' + sourceInstrumenId + ' versi ' + sourceInstrument.versi,
      created_by: user.email
    });

    return jsonSuccess_({
      source_instrumen_id: sourceInstrumenId,
      new_instrumen_id: targetInstrumenId,
      new_version: targetVersion,
      copied: {
        categories: newCategories.length,
        questions: newQuestions.length,
        answerOptions: newAnswerOptions.length
      }
    }, 'Clone versi instrumen berhasil dibuat.');
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

function resolveCloneInstrumentVersion_(namaInstrumen, periodeId, unitId, requestedVersion) {
  const dbInstrumenId = getDbSpreadsheetId_('INSTRUMEN');

  const instruments = readTable_(
    dbInstrumenId,
    CONFIG.SHEETS.INSTRUMEN_HEADER
  ).map(sanitizeInstrument_);

  const maxExistingVersion = instruments
    .filter(function (row) {
      return normalizeText_(row.nama_instrumen) === normalizeText_(namaInstrumen) &&
        normalizeText_(row.periode_id) === normalizeText_(periodeId) &&
        normalizeText_(row.unit_id) === normalizeText_(unitId);
    })
    .reduce(function (max, row) {
      return Math.max(max, Number(row.versi || 0));
    }, 0);

  return Math.max(
    Number(requestedVersion || 1),
    maxExistingVersion + 1
  );
}