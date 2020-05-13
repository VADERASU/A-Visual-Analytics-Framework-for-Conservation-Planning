const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const users = require('./routes/users');
const data = require('./routes/data')(path.resolve(__dirname));
const palayer1 = require('./routes/palayer1')(path.resolve(__dirname));
const palayer2 = require('./routes/palayer2')(path.resolve(__dirname));
const getMetropng = require('./routes/getMetropng')(path.resolve(__dirname));
const getHiiPng = require('./routes/getHiiPng')(path.resolve(__dirname));
const getHydology = require('./routes/getHydology')(path.resolve(__dirname));
const getHydologyDist = require('./routes/getHydologyDist')(path.resolve(__dirname));
const getAmphibian = require('./routes/getAmphibian')(path.resolve(__dirname));
const getBird = require('./routes/getBird')(path.resolve(__dirname));
const getfish = require('./routes/getfish')(path.resolve(__dirname));
const getcost = require('./routes/getcost')(path.resolve(__dirname));
const getmammal = require('./routes/getmammal')(path.resolve(__dirname));
const getTree = require('./routes/getTree')(path.resolve(__dirname));
const getreptile = require('./routes/getreptile')(path.resolve(__dirname));
const getpaArea = require('./routes/getpaArea')(path.resolve(__dirname));
const palayer1and2 = require('./routes/palayer1and2')(path.resolve(__dirname));
const getRoadPng = require('./routes/getRoadPng')(path.resolve(__dirname));
const selectedSquare= require('./routes/selectedSquare')(path.resolve(__dirname));
const rankPatches= require('./routes/rankPatches')(path.resolve(__dirname));
const optimization= require('./routes/optimization')(path.resolve(__dirname));
const storeUserGrid= require('./routes/storeUserGrid')(path.resolve(__dirname));
const storeUserParcel = require('./routes/storeUserParcel')(path.resolve(__dirname));
const pAwithdiffCate = require('./routes/pAwithdiffCate')(path.resolve(__dirname));
const saveOptiRuserR= require('./routes/saveOptiRuserR')(path.resolve(__dirname));
///////////////////The path.resolve must be added, otherwise the router can not find the request

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/js', express.static(path.join(__dirname, 'public/javascripts/browser')))


app.use('/users', users);
app.use('/data', data);
app.use('/palayer1', palayer1);
app.use('/palayer2', palayer2);
app.use('/', index);
app.use('/getMetropng', getMetropng);
app.use('/getHiiPng', getHiiPng);
app.use('/getHydology', getHydology);
app.use('/getHydologyDist', getHydologyDist);
app.use('/getAmphibian', getAmphibian);
app.use('/getBird', getBird);
app.use('/getfish', getfish);
app.use('/getcost', getcost);
app.use('/getmammal', getmammal);
app.use('/getTree', getTree);
app.use('/getreptile', getreptile);
app.use('/getpaArea', getpaArea);
app.use('/palayer1and2', palayer1and2);
app.use('/getRoadPng', getRoadPng);
app.use('/selectedSquare', selectedSquare);
app.use('/rankPatches', rankPatches);
app.use('/optimization', optimization);
app.use('/storeUserGrid', storeUserGrid);
app.use('/storeUserParcel', storeUserParcel);
app.use('/pAwithdiffCate', pAwithdiffCate);
app.use('/saveOptiRuserR', saveOptiRuserR);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
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
