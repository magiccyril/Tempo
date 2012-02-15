/**
Spec :

Tous les jours à 6h

Définir demain.
Récupérer compteur rouge
Récupérer compteur blanc

Si demain est dimanche alors bleu 100%
Si demain est entre mai et octobre alors bleu 100%
Si rouge = 0 & blanc = 0 alors bleu 100%

Sinon aller sur http://clients.rte-france.com/lang/fr/visiteurs/vie/courbe_j_plus_2.jsp puis :
Récupérer toutes les valeurs du tableau. Faire une moyenne.
Si moyenne >= x_rouge
    Si demain n'est pas samedi alors rouge
    Sinon demain blanc
Si moyenne >= x_bleu et moyenne <= x_rouge alors blanc
Si moyenne <= x_bleu alors bleu

*/

var config = require('./config.js')
  , express = require('express')
  , jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')
  , async = require('async')
  , Tempo = require('./tempo.js');

/**
 * define some static variable
 */
var BLUE = 'blue'
  , WHITE = 'white'
  , RED = 'red';

/**
 * Check if a date must be a blue day.
 * It's just based on date.
 */
function check_blue_date(date) {
  if (0 == date.getDay()) {
    return true;
  }

  if (date.getMonth() + 1 < 10 && date.getMonth() > 5) {
    return true;
  }

  return false;
}

// Instanciated module
module.exports = function() {
  var app = express.createServer();

  app.db = require('./db')();
  app.on('close', app.db.close);

  app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });

  app.get('/', function(req, res) {
    // get tomorow.
    var tomorow = new Date();
    tomorow.setDate(tomorow.getDate() + 1);

    // check if the date must be blue (based on date only).
    if (check_blue_date(tomorow)) {
      res.json(BLUE);
    }

    // get red and white counters.
    async.parallel({
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
    }, function(err, values) {
      if (0 == parseInt(values.counter_red) && 0 == parseInt(values.counter_white)) {
        res.json(BLUE);
      }
      else {
        request({uri: 'http://clients.rte-france.com/lang/fr/visiteurs/vie/courbe_j_plus_2.jsp'}, function(err, response, body) {
          var self = this;

          // Just a basic error check
          if (err && response && response.statusCode !== 200) {
            console.log('Request error.');
          }

          // Send the body param as the HTML code we will parse in jsdom
          // also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
          jsdom.env({
            html: body,
            scripts: ['./jquery-1.6.min.js']
          }, function(err, window) {
            // Use jQuery just as in regular HTML page
            var $ = window.jQuery;
            var $body = $('body');

            var sum = 0;
            var number = 0;
            var table_td = $(body).find('table.fit3col td');
            table_td.each(function(i) {
              $this = $(this);
              if (i % 2) {
                sum += parseInt($this.text());
                number++;
              }
            });
            var avg = Math.round(sum / number);
            console.log(avg);

            res.json('something else');
          });
        });
      }
    });
  });

  return app;
}

// Expose dependencies to avoid duplicate modules
exports.express = express;

// Start when main module
if (module.parent == null) module.exports().listen(3000);