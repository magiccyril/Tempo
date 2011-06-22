var mysql = require('db-mysql');
var http = require('http');

var config = require('./config');

var db = new mysql.Database({
    hostname: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.db
});

http.createServer(function(req, res, param) {
  res.writeHead(200, {"Content-Type": "application/json"});

  var getQuerystring = function(key, default_value) {
    if (default_value == null) {
      default_value = '';
    }
    key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regex = new RegExp("[\\?&]"+ key +"=([^&#]*)");
    var qs = regex.exec(req.url);
    if(qs == null) {
      return default_value;
    }
    else {
      return qs[1];
    }
  }

  var date = getQuerystring("date");
  if ("" == date) {
    db.on('ready', function() {
      this.query()
        .select('*')
        .from(config.db.table)
        .order({'date': true})
        .execute(function(rows, cols) {
          res.end(JSON.stringify(rows));
        });
    }).connect();
  }
  else {
    db.on('ready', function() {
      this.query()
        .select('*')
        .from(config.db.table)
        .where('date = ?', [ date ])
        .order({'date': true})
        .execute(function(rows, cols) {
          res.end(JSON.stringify(rows));
        });
    }).connect();
  }
}).listen(config.web.port);
console.log('Server running at http://localhost:'+ config.web.port +'/');