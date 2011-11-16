
/**
 * Module dependencies.
 */

var express = require('express')
  , async = require('async')
  , gzippo = require('gzippo')
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
  //app.use(express.static(__dirname + '/public'));
  app.use(gzippo.staticGzip(__dirname + '/public'));
  app.enable('jsonp callback');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Mount scraper on /scrap.
app.use('/scrap', app.scraper_app = require('./scraper')());

// Mount webservices on /webservice.
app.use('/webservice.json', app.webservice_app = require('./webservice')());

// Homepage
app.get('/', function (req, res) {
  var today_date = new Date();
  // day start at 6AM.
  if (6 > today_date.getHours()) {
    today_date.setDate(today_date.getDate() - 1);
  }
  var today_year = today_date.getFullYear()
  var today_month = (today_date.getMonth() + 1 < 10) ? '0' + today_date.getMonth() + 1 : today_date.getMonth() + 1;
  var today_day = (today_date.getDate() < 10) ? '0' + today_date.getDate() : today_date.getDate();
  var today_str = '' + today_year + today_month + today_day;

  var tomorow_date = new Date();
  tomorow_date.setDate(today_date.getDate() + 1);
  var tomorow_year = tomorow_date.getFullYear()
  var tomorow_month = (tomorow_date.getMonth() + 1 < 10) ? '0' + tomorow_date.getMonth() + 1 : tomorow_date.getMonth() + 1;
  var tomorow_day = (tomorow_date.getDate() < 10) ? '0' + tomorow_date.getDate() : tomorow_date.getDate();
  var tomorow_str = '' + tomorow_year + tomorow_month + tomorow_day;

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
  function(err, results) {
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

if (module.parent === null) {
  app.listen(3000);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
