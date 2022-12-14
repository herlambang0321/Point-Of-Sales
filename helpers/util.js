module.exports = {
    isLoggedIn: (req, res, next) => {
        if (req.session && req.session.user) {
            return next()
        } else {
            res.redirect('/')
        }
    },
    isAdmin: (req, res, next) => {
        if (req.session && req.session.user.role == "Admin") {
            return next()
        } else {
            res.redirect('/sales')
        }
    },
    currencyFormatter: new Intl.NumberFormat('id', {
        style: 'currency',
        currency: 'IDR',

        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
    }),
}
