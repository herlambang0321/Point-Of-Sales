var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');
const moment = require('moment');

/* GET purchases listing. */
module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res, next) {
        try {
          const { rows } = await db.query('select * from purchases')
    
          res.render('purchases/list', {
            rows,
            user: req.session.user,
            successMessage: req.flash('successMessage'),
            path: req.originalUrl,
            title: 'POS Purchases',
            moment
          });
        } catch (err) {
          res.send(err)
        }
      });
    
      router.get('/tablepurchase', async (req, res, next) => {
        let params = []
    
        if (req.query.search.value) {
          params.push(`invoice ilike '%${req.query.search.value}%'`)
        }
    
        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir
    
        const total = await db.query(`select count(*) as total from purchases${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from purchases${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
        const response = {
          "draw": Number(req.query.draw),
          "recordsTotal": total.rows[0].total,
          "recordsFiltered": total.rows[0].total,
          "data": data.rows
        }
        res.json(response)
      })

    return router;
}
