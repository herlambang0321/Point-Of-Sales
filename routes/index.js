var express = require('express');
var router = express.Router();

/* GET home page. */
module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login');
  })

  router.get('/register', function (req, res, next) {
    res.render('register');
  })

  return router;
}
