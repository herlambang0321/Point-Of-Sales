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

            const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, forsort ORDER BY forsort")
            const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, forsort ORDER BY forsort")

            let getMonth = []

            for (let i = 0; i < totalpurchase.length; i++) {
                getMonth.push(totalpurchase[i].monthly)
            }

            let data = totalpurchase.concat(totalsales)
            let newData = {}
            let income = []

            data.forEach(item => {
                if (newData[item.forsort]) {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                } else {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                }
            });

            for (const key in newData) {
                income.push(newData[key])
            }

            res.render('dashboards/list', {
                user: req.session.user,
                path: req.originalUrl,
                title: 'POS Dashboards',
                currencyFormatter,
                purchases,
                sales,
                salesTotal,
                query: req.query,
                data: income
            })
        } catch (e) {
            res.send(e);
        }
    })

    router.get('/chart', isLoggedIn, async function (req, res, next) {
        try {
            const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, forsort ORDER BY forsort")
            const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, forsort ORDER BY forsort")
            let getMonth = []

            for (let i = 0; i < totalpurchase.length; i++) {
                getMonth.push(totalpurchase[i].monthly)
            }
            let data = totalpurchase.concat(totalsales)
            let newData = {}
            let income = []
            data.forEach(item => {
                if (newData[item.forsort]) {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                } else {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                }
            });
            for (const key in newData) {
                income.push(Number(newData[key].revenue - newData[key].expense))
            }
            res.json({
                getMonth,
                income
            })
        } catch (e) {
            res.send(e);
        }
    })

    return router;
}
