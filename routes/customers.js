var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');

/* GET customers listing. */
module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from customers')

            res.render('customers/list', {
                rows,
                user: req.session.user,
                successMessage: req.flash('successMessage'),
                path: req.originalUrl,
                title: 'POS Customers'
            });
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/tablecustomer', async (req, res, next) => {
        let params = []

        if (req.query.search.value) {
            params.push(`name ilike '%${req.query.search.value}%'`)
        }
        if (req.query.search.value) {
            params.push(`address ilike '%${req.query.search.value}%'`)
        }
        if (req.query.search.value) {
            params.push(`phone ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir

        const total = await db.query(`select count(*) as total from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
            res.render('customers/add', {
                rows: {},
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Customers'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/add', isLoggedIn, async function (req, res, next) {
        try {
            const { name, address, phone } = req.body
            const { rows } = await db.query('select * from customers where name = $1', [name])
            if (rows.length > 0) {
                throw 'Customer already exist'
            }

            await db.query('insert into customers(name, address, phone) values($1, $2, $3)', [name, address, phone])
            req.flash('successMessage', 'Customer created successfully')
            res.redirect('/customers')
        } catch (err) {
            req.flash('error', err)
            return res.redirect('/customers')
        }
    })

    router.get('/edit/:customerid', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from customers where customerid = $1', [req.params.customerid])
            res.render('customers/edit', {
                data: rows[0],
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Customers'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/edit/:customerid', isLoggedIn, async function (req, res, next) {
        try {
            const { name, address, phone } = req.body
            const { rows } = await db.query('update customers set name = $1, address = $2, phone = $3 where customerid = $4', [name, address, phone, req.params.customerid])
            res.redirect('/customers')
        } catch (err) {
            res.send(err)
        }
    })

    return router;
}
