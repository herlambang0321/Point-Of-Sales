var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/util');

/* GET notification listing. */
module.exports = function (db) {

    router.get('/alert', isLoggedIn, async function (req, res, next) {
        try {
            const { rows: notification } = await db.query('SELECT barcode, name, stock FROM goods WHERE stock <= 10')
            res.json(notification)
        } catch (err) {
            res.send(err)
        }
    });

    router.get('/count', isLoggedIn, async function (req, res, next) {
        try {
            const { rows: count } = await db.query('SELECT COUNT(*) FROM goods WHERE stock <= 10')
            res.json(count)
        } catch (err) {
            res.send(err)
        }
    });

    return router;
}
