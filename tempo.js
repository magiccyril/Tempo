module.exports = function(date, color) {
  // tempo date.
  this._date = undefined == date ? false : date;
  // tempo color.
  this._color = undefined == color ? false : color;

  /**
   * Privates
   */
  function _getTempoDay($, body, index) {
    return $(body).find('#ContentTempo .TempoDay:eq('+ index +')');
  };

  /**
   * Parse date from a EDF Website.
   */
  function _scrapDate($, tempoDay) {
    var self = this,
      date = false;

    var date_string = tempoDay.find('h4:eq(0)').text();

    var reg = new RegExp('([0-9]{1,2}) (.*) ([0-9]{4})$', 'g');
    var reg_res = reg.exec(date_string);

    if (reg_res.length > 0) {
      var day = parseInt(reg_res[1], 10) < 10 ? '0'+ reg_res[1] : reg_res[1];
      var month = reg_res[2];
      var year = reg_res[3];

      switch(month){
      case 'janvier':
        month = '01';
        break;
      case 'février':
        month = '02';
        break;
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

      date = '' + year + month + day;
    }

    return date;
  };

  /**
   * Parse color from a EDF Website.
   */
  function _scrapColor($, tempoDay) {
    var self = this,
      color = false;

    tempoDay.find('.tempoColor li').each(function(i) {
      var li = $(this);
      if ('X' === li.text().trim()) {
        color = li.attr('class');
      }
    });

    return color;
  };

   /**
    * Publics
    */
  return {
    'setDate': function(date) {
      this._date = date;
    },
    'getDate': function() {
      return this._date;
    },
    'getYear': function() {
      var date = this.getDate();
      return parseInt(date.substr(0, 4), 10);
    },
    'getMonth': function() {
      var date = this.getDate();
      return parseInt(date.substr(4, 2), 10);
    },
    'getDay': function() {
      var date = this.getDate();

      return parseInt(date.substr(6, 2), 10);
    },
    'getDayOfWeek': function() {
      var date = new Date();
      date.setFullYear(this.getYear());
      date.setMonth(this.getMonth() - 1);
      date.setDate(this.getDay());

      var dayOfWeek = date.getDay();
      // week starts on monday.
      if (0 == dayOfWeek) {
        dayOfWeek = 7;
      }
      return dayOfWeek;
    },
    'isInLeapYear': function() {
      var year = this.getYear();
      return (((year & 3) == 0) && ((year % 100 != 0) || (year % 400 == 0)));
    },

    'setColor': function(color) {
      this._color = color;
    },
    'getColor': function() {
      return this._color;
    },
    'translateColor': function(color) {
      switch(color){
      case 'blue':
        return 'Bleu';
      case 'white':
        return 'Blanc';
      case 'red':
        return 'Rouge';
      }
    },

    'scrap': function($, body, index, callback) {
      var tempoDay = _getTempoDay($, body, index);
      var color = _scrapColor($, tempoDay);
      var date = _scrapDate($, tempoDay);

      if (date && color) {
        this.setDate(date);
        this.setColor(color);
      }

      callback(this);
    },

    'toJson': function() {
      return {
        color: this.getColor(),
        date: this.getDate(),
        day: this.getDay(),
        dayOfWeek: this.getDayOfWeek(),
        month: this.getMonth(),
        t_color: this.translateColor(this.getColor()),
        year: this.getYear(),
      };
    }
  }
}