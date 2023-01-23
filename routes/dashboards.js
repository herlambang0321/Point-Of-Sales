var express = require('express');
var router = express.Router();
var path = require('path')
const { isAdmin } = require('../helpers/util');
const { currencyFormatter } = require('../public/javascripts/util')


/* GET home page. */
module.exports = function (db) {

    router.get('/', isAdmin, async function (req, res, next) {
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
        } catch (err) {
            res.send(err);
        }
    })

    router.get('/chart', isAdmin, async function (req, res, next) {
        try {
            const { startdate, enddate } = req.query

            if (startdate != '' && enddate != '') {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time BETWEEN $1 AND $2", [startdate, enddate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time BETWEEN $1 AND $2", [startdate, enddate])
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time BETWEEN $1 AND $2 GROUP BY monthly, forsort ORDER BY forsort", [startdate, enddate])
                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time BETWEEN $1 AND $2 GROUP BY monthly, forsort ORDER BY forsort", [startdate, enddate])
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
                    direct,
                    member,
                    getMonth,
                    income
                })
            } else if (startdate) {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time >= $1", [startdate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time >= $1", [startdate])
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time >= $1 GROUP BY monthly, forsort ORDER BY forsort", [startdate])
                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time >= $1 GROUP BY monthly, forsort ORDER BY forsort", [startdate])

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
                    direct,
                    member,
                    getMonth,
                    income
                })
            } else if (enddate) {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time <= $1", [enddate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time <= $1", [enddate])
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time <= $1 GROUP BY monthly, forsort ORDER BY forsort", [enddate])
                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time <= $1 GROUP BY monthly, forsort ORDER BY forsort", [enddate])

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
                    direct,
                    member,
                    getMonth,
                    income
                })
            } else {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 ")
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 ")
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
                    direct,
                    member,
                    getMonth,
                    income
                })
            }
        } catch (err) {
            res.send(err)
        }
    })

    return router;
}
