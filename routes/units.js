var express = require('express');
var router = express.Router();
var path = require('path')
const { isAdmin } = require('../helpers/util');

/* GET units listing. */
module.exports = function (db) {

  router.get('/', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('select * from units')

      res.render('units/list', {
        rows,
        user: req.session.user,
        successMessage: req.flash('successMessage'),
        path: req.originalUrl,
        title: 'POS Units'
      });
    } catch (err) {
      res.send(err)
    }
  });

  router.get('/tableunit', async (req, res, next) => {
    let params = []

    if (req.query.search.value) {
      params.push(`unit ilike '%${req.query.search.value}%'`)
    }
    if (req.query.search.value) {
      params.push(`name ilike '%${req.query.search.value}%'`)
    }
    if (req.query.search.value) {
      params.push(`note ilike '%${req.query.search.value}%'`)
    }

    const limit = req.query.length
    const offset = req.query.start
    const sortBy = req.query.columns[req.query.order[0].column].data
    const sortMode = req.query.order[0].dir

    const total = await db.query(`select count(*) as total from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    const data = await db.query(`select * from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
      res.render('units/add', {
        rows: {},
        user: req.session.user,
        path: req.originalUrl,
        title: 'POS Units'
      })
    } catch (err) {
      res.send(err)
    }
  })

  router.post('/add', isAdmin, async function (req, res, next) {
    try {
      const { unit, name, note } = req.body
      const { rows } = await db.query('insert into units (unit, name, note) values($1, $2, $3)', [unit, name, note])
      res.redirect('/units')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/edit/:unit', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('select * from units where unit = $1', [req.params.unit])
      res.render('units/edit', {
        data: rows[0],
        user: req.session.user,
        path: req.originalUrl,
        title: 'POS Units'
      })
    } catch (err) {
      res.send(err)
    }
  })

  router.post('/edit/:unit', isAdmin, async function (req, res, next) {
    try {
      const { name, note } = req.body
      const { rows } = await db.query('update units set name = $1, note = $2 where unit = $3', [name, note, req.params.unit])
      res.redirect('/units')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/delete/:unit', isAdmin, async function (req, res, next) {
    try {
      const { rows } = await db.query('delete from units where unit = $1', [req.params.unit])
      res.redirect('/units')
    } catch (err) {
      res.send(err)
    }
  });

  return router;
}
