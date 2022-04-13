const ERR = require('async-stacktrace');
const path = require('path');
const express = require('express');
const router = express.Router({
  mergeParams: true,
});

const error = require('../../../../prairielib/error');
const sqldb = require('../../../../prairielib/lib/sql-db');
const sqlLoader = require('../../../../prairielib/lib/sql-loader');
const syncHelpers = require('../../../../pages/shared/syncHelpers');

const sql = sqlLoader.load(path.join(__dirname, '..', 'queries.sql'));

router.get('/', (req, res, next) => {
  const params = {
    course_id: res.locals.course.id,
  };
  sqldb.queryOneRow(sql.select_course_info, params, (err, result) => {
    if (ERR(err, next)) return;
    res.status(200).send(result.rows[0].item);
  });
});

router.post('/syncs/pull', (req, res, next) => {
  if (!res.locals.authz_data.has_course_permission_edit) {
    return next(error.make(403, 'Access denied (must be course editor)', {
      locals: res.locals,
    }));
  }

  syncHelpers.pullAndUpdate(res.locals, function (err, job_sequence_id) {
    if (ERR(err, next)) return;
    res.status(200).send({
      job_sequence_id: job_sequence_id,
    });
  });
});

router.get('/job_sequences', (req, res, next) => {
  const params = {
    course_id: res.locals.course.id,
  };
  sqldb.queryOneRow(sql.select_job_sequences, params, (err, result) => {
    if (ERR(err, next)) return;
    res.status(200).send(result.rows[0].item);
  });
});

router.get('/job_sequences/:job_sequence_id', (req, res, next) => {
  const params = {
    course_id: res.locals.course.id,
    job_sequence_id: req.params.job_sequence_id,
  };
  sqldb.queryOneRow(sql.select_job_sequence_with_jobs, params, (err, result) => {
    if (ERR(err, next)) return;
    const data = result.rows[0].item;
    if (data.length === 0) {
      res.status(404).send({
        message: 'Not Found',
      });
    } else {
      res.status(200).send(data[0]);
    }
  });
});

module.exports = router;
