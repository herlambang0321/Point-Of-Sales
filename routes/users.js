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
      const addUsers = await db.query('insert into users (email, name, password, role) values($1, $2, $3, $4)', [email, name, hash, role])
      res.redirect('/users')
    } catch (err) {
      console.log(err)
      res.send(err)
    }
  })

  router.get('/edit/:userid', isLoggedIn, async function (req, res, next) {
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

  router.post('/edit/:userid', isLoggedIn, async function (req, res, next) {
    try {
      const {email, name, role} = req.body
      const editUser = await db.query('update users set email = $1, name = $2, role = $3 where userid = $4', [email, name, role, req.params.userid])
      res.redirect('/users')
    } catch (err) {
      res.send(err)
    }
  })

  return router;
}
