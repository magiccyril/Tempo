var express = require('express')
  , Tempo = require('./tempo.js');

var app = express.createServer();

app.db = require('./db')();
app.on('close', app.db.close);

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

/**
 * Get a full month of forecast.
 */
function getMonth(year, month, formatted, callback) {
  var fetch_param = ''+ year;
  if (month < 10) {
    fetch_param += '0' + month;
  }
  else {
    fetch_param += ''+ month;
  }

  app.db.fetchMonth(fetch_param, function(err, month_days) {
    if (err) {
      return callback(err);
    }

    // get the nomber days in this month.
    var nb_days_in_month;
    switch(month){
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      nb_days_in_month = 31;
      break;
    case 2:
      // in case of febuary we have to check if it's a leap year.
      var isLeapYear = (((year & 3) == 0) && ((year % 100 != 0) || (year % 400 == 0)));
      if (isLeapYear) {
        nb_days_in_month = 29;
      }
      else {
        nb_days_in_month = 28;
      }
      break;
    default:
      nb_days_in_month = 30;
    }

    // check if the return values have enought days,
    // and append with some days oif there's not enought.
    if (month_days.length < nb_days_in_month) {
      for (var i = month_days.length + 1; i <= nb_days_in_month; i++) {
        var date_str = ''+ fetch_param;
        if (i < 10) {
          date_str += '0'+ i;
        }
        else {
          date_str += ''+ i;
        }

        var day = new Tempo();
        day.setDate(date_str);
        month_days.push(day);
      }
    }

    var json = new Array();

    // set values to json.
    for (var i in month_days) {
      var day = month_days[i];

      // if no day, create an empty Tempo object.
      if (false == day) {
        day = new Tempo();
        var i_str = parseInt(i, 10) + 1;
        if (i_str < 10) {
          i_str = '0'+ i_str;
        }
        day.setDate(''+ date + i_str);
      }

      json.push(day.toJson());
    }

    if (formatted) {
      var flat_json = json;
      json = new Array();
      var date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(1);

      var nb_to_unshift = 0;
      // find the monday of the date week.
      while (1 != date.getDay()) {
        nb_to_unshift++;
        date.setDate(date.getDate() - 1);
      }

      // insert fake elements on the top of the json array,
      // to make it begin on monday.
      for (var i = 0; i < nb_to_unshift; i++) {
        flat_json.unshift(undefined);
      }

      for (var i = 0; i < flat_json.length; i = i + 7) {
        var flat_week = flat_json.slice(i, i + 7);

        // make sure each weeks make 7 days.
        if (flat_week.length < 7) {
          var nb_to_push = 7 - flat_week.length;
          for (var j = 0; j < nb_to_push; j++) {
            flat_week.push(undefined);
          }
        }

        var week = new Array();
        for (var j = 0; j < flat_week.length; j++) {
          var day = flat_week[j];
          week.push(day);
          date.setDate(date.getDate() + 1);
        }

        json.push(week);
      }
    }

    callback(null, json);
  });
}

/**
 * Get a single day forecast.
 */
function getDay(year, month, day, callback) {
  if (month < 10) {
    month = '0'+ month;
  }
  if (day < 10) {
    day = '0'+ day;
  }

  var date = '' + year + month + day;

  app.db.fetchDay(date, function(err, day) {
    if (err) {
      return callback(err);
    }

    callback(null, day.toJson());
  });
}

// Instanciated module
module.exports = function() {

  app.get('/', function(req, res) {
    if (!req.query) {
      var err = {
        'msg': 'Missing parameters',
        'code': 500
      };
      callback(err);
    }

    // get required parameters.
    var year = parseInt(req.query.year, 10) ? parseInt(req.query.year, 10) : new Date().getFullYear();
    var month = parseInt(req.query.month, 10) ? parseInt(req.query.month, 10) : new Date().getMonth() + 1;

    // is there a day parameter.
    var day = false;
    if (req.query.day && parseInt(req.query.day, 10)) {
      day = parseInt(req.query.day, 10);
    }

    // is there a formatted parameter.
    var formatted = false;
    if (req.query && req.query.formatted) {
      if ('true' == req.query.formatted.toLowerCase()
        || 't' == req.query.formatted.toLowerCase()
        || '1' == req.query.formatted) {
        formatted = true;
      }
    }

    res.header('Access-Control-Allow-Origin', '*');

    // if there's no day parameter,
    // get month forecast.
    if (false === day) {
      getMonth(year, month, formatted, function(err, json) {
        if (err) {
          return res.json(err, 500);
        }

        res.json(json);
      });
    }
    // get day forecast.
    else {
      getDay(year, month, day, function(err, json) {
        if (err) {
          return res.json(err, 500);
        }

        res.json(json);
      });
    }
  });

  return app;
}

// Expose dependencies to avoid duplicate modules
exports.express = express;

// Start when main module
if (module.parent == null) module.exports().listen(3000);