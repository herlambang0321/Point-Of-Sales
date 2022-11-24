var express = require('express');
var router = express.Router();
var path = require('path')
const { isLoggedIn } = require('../helpers/util');

/* GET suppliers listing. */
module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from suppliers')

            res.render('suppliers/list', {
                rows,
                user: req.session.user,
                successMessage: req.flash('successMessage'),
                path: req.originalUrl,
                title: 'POS Suppliers'
            });
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/tablesupplier', async (req, res, next) => {
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

        const total = await db.query(`select count(*) as total from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
            res.render('suppliers/add', {
                rows: {},
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Suppliers'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/add', isLoggedIn, async function (req, res, next) {
        try {
            const { name, address, phone } = req.body
            const { rows } = await db.query('select * from suppliers where name = $1', [name])
            if (rows.length > 0) {
                throw 'Supplier already exist'
            }

            await db.query('insert into suppliers(name, address, phone) values($1, $2, $3)', [name, address, phone])
            req.flash('successMessage', 'Supplier created successfully')
            res.redirect('/suppliers')
        } catch (err) {
            req.flash('error', err)
            return res.redirect('/suppliers')
        }
    })

    router.get('/edit/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from suppliers where supplierid = $1', [req.params.supplierid])
            res.render('suppliers/edit', {
                data: rows[0],
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Suppliers'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/edit/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const { name, address, phone } = req.body
            const { rows } = await db.query('update suppliers set name = $1, address = $2, phone = $3 where supplierid = $4', [name, address, phone, req.params.supplierid])
            res.redirect('/suppliers')
        } catch (err) {
            res.send(err)
        }
    })

    router.get('/delete/:supplierid', isLoggedIn, async function (req, res, next) {
        try {
            const { rows } = await db.query('delete from suppliers where supplierid = $1', [req.params.supplierid])

            res.redirect('/suppliers')
        } catch (err) {
            res.send(err)
        }
    });

    return router;
}
