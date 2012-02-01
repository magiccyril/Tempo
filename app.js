
/**
 * Module dependencies.
 */

var express = require('express')
  , async = require('async')
  , config = require('./config.js')
  , app = module.exports = express.createServer();

app.db = require('./db')();
app.on('close', app.db.close);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.enable('jsonp callback');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

/**
 * Helper function to transform a date object to a string date.
 *
 * @param date : a date object.
 * @return string.
 */
function date_toString(date) {
  var date_year = date.getFullYear();
  var date_month = date.getMonth() + 1;
  if (date_month < 10) {
    date_month = '0'+ date_month;
  }
  var date_day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();

  return '' + date_year + date_month + date_day;
}

/*
 * Helper function to get all the datas to render a single page.
 * @param callback : function(err, results)
 */
function getDatas(callback) {
  var today_date = new Date();
  // day start at 6AM.
  if (6 > today_date.getHours()) {
    today_date.setDate(today_date.getDate() - 1);
  }
  var today_str = date_toString(today_date);

  var tomorow_date = new Date();
  tomorow_date.setDate(today_date.getDate() + 1);
  var tomorow_str = date_toString(tomorow_date);

  // parallel : get views paremeter.
  async.parallel({
    // get today.
    today: function(callback) {
      app.db.fetchDay(today_str, function(err, day) {
        callback(null, day);
      });
    },
    // get tomorow.
    tomorow: function(callback) {
      app.db.fetchDay(tomorow_str, function(err, day) {
        callback(null, day);
      });
    },
    // get red counter.
    counter_red: function(callback) {
      app.db.fetchCounter('red', function(err, count) {
        callback(null, count);
      });
    },
    // get white counter.
    counter_white: function(callback) {
      app.db.fetchCounter('white', function(err, count) {
        callback(null, count);
      });
    },
    // get blue counter.
    counter_blue: function(callback) {
      app.db.fetchCounter('blue', function(err, count) {
        callback(null, count);
      });
    }
  },
  callback);
}

// Mount scraper on /scrap.
app.use('/scrap', app.scraper_app = require('./scraper')());

// Mount webservices on /webservice.
app.use('/webservice.json', app.webservice_app = require('./webservice')());

// Google site verification
app.get('/google'+ config.google_site_verification +'.html', function (req, res) {
  res.send('google-site-verification: google'+ config.google_site_verification +'.html', { 'Content-Type': 'text/plain' });
});

// robots.txt
app.get('/robots.txt', function (req, res) {
  res.send("User-agent: *\r\nAllow: /", { 'Content-Type': 'text/plain' });
});

// Homepage
app.get('/', function (req, res) {
  getDatas(function(err, results) {
    res.render('index', {
      'title': 'Tempo',
      'today': results.today,
      'tomorow': results.tomorow,
      'counter_red': results.counter_red,
      'counter_white': results.counter_white,
      'counter_blue': results.counter_blue
    });
  });
});

// Facebook tab page.
app.all('/facebook_tab_page', function (req, res) {
  getDatas(function(err, results) {
    res.render('facebook_tab_page', {
      'layout': false,
      'title': 'Tempo',
      'today': results.today,
      'tomorow': results.tomorow,
      'counter_red': results.counter_red,
      'counter_white': results.counter_white,
      'counter_blue': results.counter_blue
    });
  });
})

if (module.parent === null) {
  app.listen(3000);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
