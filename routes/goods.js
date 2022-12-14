var express = require('express');
var router = express.Router();
var path = require('path')
const { isAdmin } = require('../helpers/util');

/* GET goods listing. */
module.exports = function (db) {

    router.get('/', isAdmin, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from goods')

            res.render('goods/list', {
                rows,
                user: req.session.user,
                successMessage: req.flash('successMessage'),
                path: req.originalUrl,
                title: 'POS Goods'
            });
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/tablegood', async (req, res, next) => {
        let params = []

        if (req.query.search.value) {
            params.push(`barcode ilike '%${req.query.search.value}%'`)
        }
        if (req.query.search.value) {
            params.push(`name ilike '%${req.query.search.value}%'`)
        }

        const limit = req.query.length
        const offset = req.query.start
        const sortBy = req.query.columns[req.query.order[0].column].data
        const sortMode = req.query.order[0].dir

        const total = await db.query(`select count(*) as total from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
            const { rows: units } = await db.query('select * from units')

            res.render('goods/add', {
                data: {},
                units,
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Goods'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/add', isAdmin, async function (req, res, next) {
        try {
            let file;
            let uploadPath;

            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }

            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            file = req.files.sampleFile;
            const fileName = `${Date.now()}-${file.name}`
            uploadPath = path.join(__dirname, '..', 'public', 'images', 'uploadgoods', fileName);

            // Use the mv() method to place the file somewhere on your server
            file.mv(uploadPath)

            const { barcode, name, stock, purchaseprice, sellingprice, unit } = req.body

            const { rows } = await db.query('insert into goods (barcode, name, stock, purchaseprice, sellingprice, unit, picture) values ($1, $2, $3, $4, $5, $6, $7)', [barcode, name, stock, purchaseprice, sellingprice, unit, fileName])

            res.redirect('/goods')
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/edit/:barcode', isAdmin, async function (req, res, next) {
        try {
            const { rows } = await db.query('select * from goods where barcode = $1', [req.params.barcode])
            const { rows: units } = await db.query('SELECT * FROM units')
            res.render('goods/edit', {
                data: rows[0],
                units,
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Goods'
            })
        } catch (err) {
            res.send(err)
        }
    })

    router.post('/edit/:barcode', isAdmin, async function (req, res, next) {
        try {
            const { name, stock, purchaseprice, sellingprice, unit } = req.body

            let file;
            let uploadPath;

            if (!req.files || Object.keys(req.files).length === 0) {
                await db.query('update goods set name=$1, stock=$2, purchaseprice=$3, sellingprice=$4, unit=$5 WHERE barcode=$6',
                    [name, stock, purchaseprice, sellingprice, unit, req.params.barcode])
            } else {
                // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                file = req.files.sampleFile;
                const fileName = `${Date.now()}-${file.name}`
                uploadPath = path.join(__dirname, '..', 'public', 'images', 'uploadgoods', fileName);
                file.mv(uploadPath)

                await db.query('update goods set name=$1, stock=$2, purchaseprice=$3, sellingprice=$4, unit=$5, picture=$6 WHERE barcode=$7', [name, stock, purchaseprice, sellingprice, unit, fileName, req.params.barcode])
            }
            res.redirect('/goods')
        } catch (err) {
            res.send(err)
        }
    })

    router.get('/delete/:barcode', isAdmin, async function (req, res, next) {
        try {
            const { rows } = await db.query('delete from goods where barcode = $1', [req.params.barcode])
            res.redirect('/goods')
        } catch (err) {
            res.send(err)
        }
    });

    return router;
}
