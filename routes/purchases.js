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

    router.get('/create', async function (req, res, next) {
        try {
            const { userid } = req.session.user
            const { rows } = await db.query('INSERT INTO purchases(totalsum, operator) VALUES(0, $1) returning *', [userid])
            res.redirect(`/purchases/show/${rows[0].invoice}`)
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/show/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const purchases = await db.query('SELECT p.*, s.* FROM purchases AS p LEFT JOIN suppliers as s ON p.supplier = s.supplierid where invoice = $1', [req.params.invoice])
            const users = await db.query('SELECT * FROM users ORDER BY userid')
            const { rows: goods } = await db.query('SELECT barcode, name FROM goods ORDER BY barcode')
            const { rows } = await db.query('SELECT * FROM suppliers ORDER BY supplierid')

            res.render('purchases/form', {
                path: req.originalUrl,
                title: 'POS Purchases',
                user: req.session.user,
                purchases: purchases.rows[0],
                goods,
                users,
                supplier: rows,
                moment,
            })
        } catch (err) {
            res.send(err);
        }
    });

    return router;
}
