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
            const { rows } = await db.query('select * from sales')

            res.render('sales/list', {
                rows,
                user: req.session.user,
                successMessage: req.flash('successMessage'),
                path: req.originalUrl,
                title: 'POS Sales',
                currencyFormatter,
                moment
            });
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/tablesale', async (req, res, next) => {
        let params = []

        if (req.query.search.value) {
            params.push(`invoice ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir

        const total = await db.query(`select count(*) as total from sales${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select s.*, c.* from sales as s left join customers as c on s.customer = c.customerid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
            const { rows } = await db.query('INSERT INTO sales(totalsum, operator) VALUES(0, $1) returning *', [userid])
            res.redirect(`/sales/show/${rows[0].invoice}`)
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/show/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const sales = await db.query('SELECT s.*, c.* FROM sales AS s LEFT JOIN customers AS c ON s.customer = c.customerid where invoice = $1', [req.params.invoice])
            const users = await db.query('SELECT * FROM users ORDER BY userid')
            const { rows: goods } = await db.query('SELECT barcode, name FROM goods ORDER BY barcode')
            const { rows } = await db.query('SELECT * FROM customers ORDER BY customerid')

            res.render('sales/form', {
                path: req.originalUrl,
                title: 'POS Sales',
                user: req.session.user,
                sales: sales.rows[0],
                goods,
                users,
                customers: rows,
                moment,
            })
        } catch (err) {
            res.send(err);
        }
    });

    router.post('/show/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const { totalsum, pay, change, customer } = req.body
            const s = await db.query('UPDATE sales SET totalsum = $1, pay = $2, change = $3, customer = $4 WHERE invoice = $5', [totalsum, pay, change, customer, req.params.invoice])
            console.log(s);

            req.flash('successMessage', 'Transaction Success!')
            res.redirect('/sales')
        } catch (error) {
            console.log(error);
            req.flash('error', 'Transaction Fail!')
            return res.redirect('/sales')
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
            await db.query('INSERT INTO saleitems (invoice, itemcode, quantity) VALUES ($1, $2, $3) returning*', [invoice, itemcode, quantity]);
            const { rows } = await db.query('SELECT * FROM sales WHERE invoice = $1', [invoice])

            res.json(rows[0])
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/details/:invoice', isLoggedIn, async (req, res, next) => {
        try {
            const { rows: data } = await db.query('SELECT saleitems.*, goods.name FROM saleitems LEFT JOIN goods ON saleitems.itemcode = goods.barcode WHERE saleitems.invoice = $1 ORDER BY saleitems.id', [req.params.invoice])

            res.json(data)
        } catch (err) {
            res.send(err)
        }
    });

    return router;
}
