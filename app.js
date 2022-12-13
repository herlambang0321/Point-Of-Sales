var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'posdb',
  password: '12345',
  port: 5432,
})

var indexRouter = require('./routes/index')(pool);
var usersRouter = require('./routes/users')(pool);
var unitsRouter = require('./routes/units')(pool);
var goodsRouter = require('./routes/goods')(pool);
var suppliersRouter = require('./routes/suppliers')(pool);
var purchasesRouter = require('./routes/purchases')(pool);
var customersRouter = require('./routes/customers')(pool);
var salesRouter = require('./routes/sales')(pool);
var dashboardsRouter = require('./routes/dashboards')(pool);
var notificationRouter = require('./routes/notification')(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'rubicamp',
  resave: false,
  saveUninitialized: true
}))
app.use(flash());
app.use(fileUpload());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/units', unitsRouter);
app.use('/goods', goodsRouter);
app.use('/suppliers', suppliersRouter);
app.use('/purchases', purchasesRouter);
app.use('/customers', customersRouter);
app.use('/sales', salesRouter);
app.use('/dashboards', dashboardsRouter);
app.use('/notification', notificationRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
