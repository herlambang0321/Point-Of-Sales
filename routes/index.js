var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { isLoggedIn } = require('../helpers/util');
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login', {
      loginMessage: req.flash('loginMessage')
    });
  })

  router.post('/', async function (req, res, next) {
    try {
      const { email, password } = req.body

      const { rows } = await db.query('select * from users where email = $1', [email])

      if (rows.length == 0) {
        // throw 'e-mail is not registered'
        req.flash('loginMessage', 'e-mail is not registered')
        return res.redirect('/')
      }

      const match = await bcrypt.compare(password, rows[0].password);

      if (!match) {
        // throw 'password wrong'
        req.flash('loginMessage', 'password wrong')
        return res.redirect('/')
      }

      req.session.user = rows[0]

      res.redirect('/dashboard')

    } catch (err) {
      res.send(err)
    }
  })

  router.get('/register', function (err, res, next) {
    res.render('register')
  })

  router.post('/register', async function (req, res, next) {
    try {
      const { email, name, password, role } = req.body

      const { rows } = await db.query('select * from users where email = $1', [email])

      if (rows.length > 0) {
        throw 'e-mail already registered'
      }

      const hash = await bcrypt.hashSync(password, saltRounds);
      const createUser = await db.query('insert into users (email, name, password, role) values($1, $2, $3, $4)', [email, name, hash, role])
      res.redirect('/')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/dashboard', isLoggedIn, function (req, res, next) {
    res.render('dashboard', {
      user: req.session.user
    })
  })

  return router;
}
