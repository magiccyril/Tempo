var program = require('commander')
  , fs = require('fs')
  , util = require('util')
  , Tempo = require('./tempo.js')
  , async = require('async');

var db = require('./db')();
process.on('exit', function () {
  db.close;
});

program.version('0.0.1');

program
  .command('import <path>')
  .description('Import <path> file')
  .action(function(path){
    fs.readFile(path, function(err, data) {
      if (err) {
        throw err;
        process.exit(1);
      }

      var days = new Array();
      var data = JSON.parse(data);
      for (i in data) {
        var day = data[i];

        var tempo = new Tempo();
        tempo.setDate(day.date);
        tempo.setColor(day.color);
        days.push(tempo);
      }

      var iterator = function(item, callback) {
        db.save(item, function(err, day) {
          callback(err);
        });
      }

      async.map(days, iterator, function(err, results) {
        if (err) {
          throw err;
          process.exit(1);
        }

        console.log('%s file imported - %d days imported', path, results.length);
        process.exit(0);
      });
    });
  });

program
  .command('export <path>')
  .description('Export all datas to <path> file')
  .action(function(path){
    db.fetchAll(function(err, values) {
      if (err) {
        throw err;
        process.exit(1);
      }

      fs.writeFile(path, JSON.stringify(values), function (err) {
        if (err) {
          throw err;
          process.exit(1);
        }

        console.log('All data exported to %s', path);
        process.exit(0);
      });
    });
  });

program.parse(process.argv);