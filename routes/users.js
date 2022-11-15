var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');

/* GET users listing. */
module.exports = function (db) {

  router.get('/', isLoggedIn, async function (req, res, next) {
    try {
      const { rows } = await db.query('select * from users')

      res.render('users/list', {
        rows,
        user: req.session.user,
        successMessage: req.flash('successMessage'),
        path: req.originalUrl,
        title: 'POS Users'
      });

    } catch (err) {
      res.send(err)
    }
  });

  return router;
}
