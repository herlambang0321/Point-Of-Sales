var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');
const { currencyFormatter } = require('../public/javascripts/util')


/* GET home page. */
module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res, next) {
        try {
            res.render('dashboards/list', {
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Dashboards'
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