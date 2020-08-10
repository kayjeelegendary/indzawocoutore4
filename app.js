const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const expressValidator = require('express-validator');
const passport = require('passport');
const authenticated = require('./config/auth');

//Set connection to mongoose
const mongoDB = 'mongodb://127.0.0.1/cmscart';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Set routes
const index = require('./routes/index');
const admin_page = require('./routes/admin_page');
const admin_category = require('./routes/admin_category');
const admin_product = require('./routes/admin_product');
const products = require('./routes/products');
const cart = require('./routes/cart');
const user = require('./routes/user');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser('secret'));

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));
app.use(flash());

app.use(expressValidator());
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');


app.locals.errors = null;
app.locals.success = null;

app.all('*', function(req, res, next) {
  if(req.session.cart === undefined) {
    app.locals.cart = 0;
  }else {
    app.locals.cart = req.session.cart.length;
  }
  next();
});

const Page = require('./models/pages');
const Category = require('./models/categories');

Page.find(function (err, pages) {
  if (err) return console.log(err);
  app.locals.pages = pages;
});

Category.find(function (err, categories) {
    if (err) console.log(err);
    app.locals.categories = categories;
  });

app.all('*', function(req, res, next) {
  res.locals.user = req.user || null;
  next();
});

app.use('/admin/pages',authenticated, admin_page);
app.use('/products', products);
app.use('/admin/categories',authenticated, admin_category);
app.use('/admin/products',authenticated, admin_product);
app.use('/cart', cart);
app.use('/user', user);
app.use('/', index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
