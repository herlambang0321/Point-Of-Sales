var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');
const { currencyFormatter } = require('../public/javascripts/util')
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
                currencyFormatter,
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
        const data = await db.query(`select p.*, s.* from purchases as p left join suppliers as s on p.supplier = s.supplierid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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

    router.post('/show/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const { totalsum, supplier } = req.body
            await db.query('UPDATE purchases SET totalsum = $1, supplier = $2 WHERE invoice = $3', [totalsum, supplier, req.params.invoice])

            req.flash('successMessage', 'Transaction Success!')
            res.redirect('/purchases')
        } catch (error) {
            req.flash('error', 'Transaction Fail!')
            return res.redirect('/purchases')
        }
    });

    router.get('/goods/:barcode', isLoggedIn, async (req, res) => {
        try {
            const { rows } = await db.query('SELECT * FROM goods WHERE barcode = $1', [req.params.barcode]);

            res.json(rows[0])
        } catch (err) {
            res.send(err)
        }
    });

    router.post('/additem', isLoggedIn, async (req, res) => {
        try {
            const { invoice, itemcode, quantity } = req.body
            await db.query('INSERT INTO purchaseitems (invoice, itemcode, quantity)VALUES ($1, $2, $3) returning*', [invoice, itemcode, quantity]);
            const { rows } = await db.query('SELECT * FROM purchases WHERE invoice = $1', [invoice])

            res.json(rows[0])
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/details/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const { rows: data } = await db.query('SELECT purchaseitems.*, goods.name FROM purchaseitems LEFT JOIN goods ON purchaseitems.itemcode = goods.barcode WHERE purchaseitems.invoice = $1 ORDER BY purchaseitems.id', [req.params.invoice])

            res.json(data)
        } catch (err) {
            res.send(err)
        }
    });

    return router;
}
