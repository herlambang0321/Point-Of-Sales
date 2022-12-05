var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');
const { currencyFormatter } = require('../public/javascripts/util')


/* GET home page. */
module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res, next) {
        try {
            const { rows: purchases } = await db.query('SELECT sum(totalsum) AS total FROM purchases')
            const { rows: sales } = await db.query('SELECT sum(totalsum) AS total FROM sales')
            const { rows: salesTotal } = await db.query('SELECT COUNT(*) AS total FROM sales')

            res.render('dashboards/list', {
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Dashboards',
                currencyFormatter,
                purchases,
                sales,
                salesTotal
            })
        } catch (e) {
            res.send(e);
        }
    })

    // router.get('/tabledashboard', async (req, res, next) => {
    //     let params = []

    //     if (req.query.search.value) {
    //         params.push(`monthly ilike '%${req.query.search.value}%'`)
    //     }

    //     const limit = req.query.length
    //     const offset = req.query.start
    //     const sortBy = req.query.columns[req.query.order[0].column].data
    //     const sortMode = req.query.order[0].dir

    //     const total = await db.query(`select count(*) as total from ${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
    //     const data = await db.query(`select * from ${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
    //     const response = {
    //         "draw": Number(req.query.draw),
    //         "recordsTotal": total.rows[0].total,
    //         "recordsFiltered": total.rows[0].total,
    //         "data": data.rows
    //     }
    //     res.json(response)
    // })

    return router;
}