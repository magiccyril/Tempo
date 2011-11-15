var express = require('express')
  , jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')
  , Tempo = require('./tempo.js');

var edf_tempo_url = 'http://bleuciel.edf.com/abonnement-et-contrat/les-prix/les-prix-de-l-electricite/option-tempo/la-couleur-du-jour-2585.html&coe_i_id=2585';

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
    request({uri: edf_tempo_url}, function(err, response, body) {
      var self = this;

      // Just a basic error check
      if (err && response && response.statusCode !== 200) {
        console.log('Request error.');
      }

      // Send the body param as the HTML code we will parse in jsdom
      // also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
      jsdom.env({
        html: body,
        scripts: ['http://code.jquery.com/jquery-1.6.min.js']
      }, function(err, window) {
        // Use jQuery just as in regular HTML page
        var $ = window.jQuery;
        var $body = $('body');

        // function to save the forecast.
        var save = function(day) {
          app.db.save(day, function(err, day) {
            if (err) {
              console.log(err);
            }
          });
        }

        // create a new Tempo object and scrap brefore saving.
        var today = new Tempo();
        today.scrap($, $body, 0, save);

        // create a new Tempo object and scrap brefore saving.
        var tomorrow = new Tempo();
        tomorrow.scrap($, $body, 1, save);

        res.end('Done');
      });
    });
  });

  return app;
}

// Expose dependencies to avoid duplicate modules
exports.express = express;

// Start when main module
if (module.parent == null) module.exports().listen(3000);