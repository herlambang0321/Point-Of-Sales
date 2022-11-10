var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/util');

/* GET users listing. */
module.exports = function (db) {

  router.get('/', isLoggedIn, function (req, res, next) {
    res.render('users', {
      user: req.session.user
    });
  });

  return router;
}
