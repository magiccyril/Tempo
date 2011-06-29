var jsdom  = require('jsdom');
var mysql = require('db-mysql');
var config = require('./config');

var JQUERY_PATH = 'jquery.js';
var URL = 'http://bleuciel.edf.com/abonnement-et-contrat/les-prix/les-prix-de-l-electricite/option-tempo/la-couleur-du-jour-2585.html&coe_i_id=2585';

/**
 * Standard trim function.
 */
function trim(string) {
  return string.replace(/^\s+/g,'').replace(/\s+$/g,'') 
}

/**
 * Scrap ! Main function.
 */
jsdom.env(URL, [ JQUERY_PATH ], function(errors, window) {
  // get tempo colors html.
  var tempoColors = window.$('.TempoDay .tempoColor');
  // get the days html.
  var tempoDays = window.$('.TempoDay h4');

  /**
   * return the tempo color from html.
   */
  var get_color = function(html) {
    var color = 'error';
    if (window.$(html).find('.blue').text() == 'X') {
      color = 'blue';
    }
    else if (window.$(html).find('.white').text() == 'X') {
      color = 'white';
    }
    else if (window.$(html).find('.red').text() == 'X') {
      color = 'red';
    }
    return color;
  };

  /**
   * return the date from html.
   */
  var get_day = function(html) {
    var html = window.$(html).text();

    // get the entire date.
    var reg = new RegExp("[0-9]{1,2}.*[0-9]{4}", "g");
    var date_string = reg.exec(html)[0];

    // get the month.
    var reg_month = new RegExp("[a-z]+", "g");
    var month_string = trim(reg_month.exec(date_string)[0]);
    var month_pos = date_string.indexOf(month_string);

    // get the day.
    var day = trim(date_string.substring(0, month_pos));
    if (day.length < 2) {
      day = '0'+ day;
    }

    // get year.
    var year = trim(date_string.substring(month_pos + month_string.length));

    var month = '00';
    switch (month_string.toLowerCase()) {
      case 'janvier':
        month = '01';
        break;
      case 'février':
        month = '02';
        break
      case 'mars':
        month = '03';
        break;
      case 'avril':
        month = '04';
        break;
      case 'mai':
        month = '05';
        break;
      case 'juin':
        month = '06';
        break;
      case 'juillet':
        month = '07';
        break;
      case 'aout':
        month = '08';
        break;
      case 'septembre':
        month = '09';
        break;
      case 'octobre':
        month = '10';
        break;
      case 'novembre':
        month = '11';
        break;
      case 'décembre':
        month = '12';
        break;
    }

    return year+month+day;
  }

  // get the color for today.
  var today = get_color(tempoColors[0]);
  // get the date for today.
  var today_date = get_day(tempoDays[0]);
  // get the color for tomorrow.
  var tomorrow = get_color(tempoColors[1]);
  // get the date for tomorrow.
  var tomorrow_date = get_day(tempoDays[1]);

  /**
   * Save to database a date and his tempo color.
   */
  var save = function(mysql, date, color) {

    // try to find if the date we want to save already exist.
    mysql.query()
        .select(['date'])
        .from(config.db.table)
        .where('date = ?', [ date ])
        .execute(function(error, rows, cols) {
          // there's some results, so we have to udapte values.
          if (rows.length > 0) {
            mysql.query()
              .update(config.db.table)
              .set({"color": color})
              .where('date = ?', [ date ])
              .execute(function() {
                console.log("Updated values date = "+ date +" / color = "+ color);
              });
          }
          // there's no results, so we have to insert values.
          else {
            mysql.query()
                .insert(config.db.table, ["date", "color"], [date, color])
                .execute(function() {
                  console.log("Inserted values date = "+ date +" / color = "+ color);
                });
          }
        });
  }

  /**
   * Check if table exist, and create it if not.
   */
  var check_table = function(mysql) {
    mysql
      .query('SELECT 1 FROM Information_schema.tables WHERE table_name = "'+ config.db.table +'" AND table_schema = "'+ config.db.db +'"')
      .execute(function(error, rows, cols) {
        if (0 == rows.length) {
          mysql
            .query('CREATE TABLE `'+ config.db.table +'` (`date` varchar(16) NOT NULL, `color` varchar(8) DEFAULT NULL, PRIMARY KEY (`date`))')
            .execute(function() {
              console.log('Table : "'+ config.db.table +'" created');
            });
        }
      });
  };

  // connect to database.
  new mysql.Database({
    hostname: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.db
  }).on('error', function(error) {
      console.log('ERROR: ' + error);
  }).on('ready', function(server) {
    // check if table exist.
    check_table(this);

    // save today.
    save(this, today_date, today);
    // save tomorrow.
    save(this, tomorrow_date, tomorrow);
  }).connect();
});