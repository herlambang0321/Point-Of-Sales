var express = require('express');
var router = express.Router();
var path = require('path')
const bcrypt = require('bcrypt');
const { isLoggedIn, isAdmin } = require('../helpers/util');
const saltRounds = 10;

/* GET users listing. */
module.exports = function (db) {

  router.get('/', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('select * from users')

      res.render('users/list', {
        rows,
        user: req.session.user,
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage'),
        path: req.originalUrl,
        title: 'POS Users'
      });
    } catch (err) {
      res.send(err)
    }
  });

  router.get('/tableuser', async (req, res, next) => {
    let params = []

    if (req.query.search.value) {
      params.push(`email ilike '%${req.query.search.value}%'`)
    }
    if (req.query.search.value) {
      params.push(`name ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    const response = {
      "draw": Number(req.query.draw),
      "recordsTotal": total.rows[0].total,
      "recordsFiltered": total.rows[0].total,
      "data": data.rows
    }
    res.json(response)
  })

  router.get('/add', isAdmin, async function (req, res, next) {
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

  router.post('/add', isAdmin, async function (req, res, next) {
    try {
      const { email, name, password, role } = req.body

      const { rows } = await db.query('select * from users where email = $1', [email])

      if (rows.length > 0) {
        throw 'e-mail already registered'
      }

      const hash = await bcrypt.hashSync(password, saltRounds);
      const addUsers = await db.query('insert into users (email, name, password, role) values($1, $2, $3, $4)', [email, name, hash, role])
      res.redirect('/users')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/edit/:userid', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('select * from users where userid = $1', [req.params.userid])

      res.render('users/edit', {
        data: rows[0],
        user: req.session.user,
        path: req.originalUrl,
        title: 'POS Users'
      })
    } catch (err) {
      res.send(err)
    }
  })

  router.post('/edit/:userid', isAdmin, async function (req, res, next) {
    try {
      const { email, name, role } = req.body
      const { rows } = await db.query('update users set email = $1, name = $2, role = $3 where userid = $4', [email, name, role, req.params.userid])
      res.redirect('/users')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/delete/:userid', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('delete from users where userid = $1', [req.params.userid])

      res.redirect('/users')
    } catch (err) {
      res.send(err)
    }
  });

  router.get('/profile', isLoggedIn, async function (req, res, next) {
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE userid = $1', [req.session.user.userid])

      res.render('users/profile', {
        data: rows[0],
        user: req.session.user,
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage'),
        path: req.originalUrl,
        title: 'POS Profile'
      })
    } catch (err) {
      res.send(err)
    }
  });

  router.post('/profile', isLoggedIn, async function (req, res, next) {
    try {
      const { email, name } = req.body
      await db.query('UPDATE users SET email = $1, name = $2 WHERE userid = $3 returning *', [email, name, req.session.user.userid])

      const { rows: emails } = await db.query('SELECT * FROM users WHERE email = $1', [email])
      const data = emails[0]

      // Session save/update
      req.session.user = data
      req.session.save()

      req.flash('successMessage', `your profile has been updated`)
      res.redirect('/users/profile')
    } catch (err) {
      res.send(err)
    }
  });

  router.get('/changepassword', isLoggedIn, async function (req, res, next) {
    try {
      res.render('users/changepassword', {
        user: req.session.user,
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage'),
        path: req.originalUrl,
        title: 'POS Change Password'
      })
    } catch (err) {
      res.send(err)
    }
  });

  router.post('/changepassword', isLoggedIn, async function (req, res, next) {
    try {
      const { oldpassword, newpassword, retypepassword } = req.body
      const { rows } = await db.query('SELECT * FROM users WHERE userid = $1', [req.session.user.userid])

      if (newpassword != retypepassword) {
        req.flash('errorMessage', "retype password doesn't match")
        return res.redirect('/users/changepassword')
      }

      if (!bcrypt.compareSync(oldpassword, rows[0].password)) {
        req.flash('errorMessage', "your old password is wrong")
        return res.redirect('/users/changepassword')
      }

      const hash = bcrypt.hashSync(newpassword, saltRounds)
      await db.query('UPDATE users SET password = $1 WHERE userid = $2', [hash, req.session.user.userid])

      req.flash('successMessage', 'your password has been updated')
      res.redirect('/users/changepassword')
    } catch (err) {
      res.send(err)
    }
  })

  return router;
}
