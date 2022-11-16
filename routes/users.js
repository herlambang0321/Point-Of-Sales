var express = require('express');
var router = express.Router();
var path = require('path')
const bcrypt = require('bcrypt');
const { isLoggedIn } = require('../helpers/util');
const saltRounds = 10;

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

  router.get('/add', isLoggedIn, async function (req, res, next) {
    try {

      res.render('users/add', {
        rows: {},
        user: req.session.user,
        path: req.originalUrl,
        title: 'POS Users'
      })
    } catch (err) {
      res.send(err)
    }
  })

  router.post('/add', isLoggedIn, async function (req, res, next) {
    try {
      const { email, name, password, role } = req.body

      const { rows } = await db.query('select * from users where email = $1', [email])

      if (rows.length > 0) {
        throw 'e-mail already registered'
      }

      const hash = await bcrypt.hashSync(password, saltRounds);
      await db.query('insert into public.users (email, name, password, role) values($1, $2, $3, $4)', [email, name, hash, role])

      res.redirect('/users')
    } catch (err) {
      console.log(err)
      res.send(err)
    }
  })

  return router;
}
