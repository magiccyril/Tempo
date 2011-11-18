var config = require('./config.js');

module.exports = function(tempoObj) {
  // a tempo object.
  this._day = tempoObj;

  this._twitterClient = false;
  if (config.twitter_enabled) {
    this._twitterClient = require('twitter-js')(config.twitter_consumer_key, config.twitter_consumer_secret);
  }

  this._twitterToken = {
    oauth_token: config.twitter_access_token_key
    , oauth_token_secret: config.twitter_access_token_secret
  }

  /**
   * Privates
   */

  /**
   * Get a human readable month.
   */
  function getMonth() {
    var string = this._day.getMonth();
    switch(parseInt(this._day.getMonth(), 10)) {
    case 1:
      string = 'janvier';
      break;
    case 2:
      string = 'février';
      break;
    case 3:
      string = 'mars';
      break;
    case 4:
      string = 'avril';
      break;
    case 5:
      string = 'mai';
      break;
    case 6:
      string = 'juin';
      break;
    case 7:
      string = 'juillet';
      break;
    case 8:
      string = 'aout';
      break;
    case 9:
      string = 'septembre';
      break;
    case 10:
      string = 'octobre';
      break;
    case 11:
      string = 'novembre';
      break;
    case 12:
      string = 'décembre';
      break;
    }

    return string;
  };

  /**
   * Get a human readable day of week.
   */
  function getDayOfWeek() {
    var string = this._day.getDayOfWeek();
    switch(this._day.getDayOfWeek()) {
    case 1:
      string = 'Lundi';
      break;
    case 2:
      string = 'Mardi';
      break;
    case 3:
      string = 'Mercredi';
      break;
    case 4:
      string = 'Jeudi';
      break;
    case 5:
      string = 'Vendredi';
      break;
    case 6:
      string = 'Samedi';
      break;
    case 7:
      string = 'Dimanche';
      break;
    }

    return string;
  }

  /**
   * Get a human readable day.
   */
  function getDay() {
    return ''+ this._day.getDay();
  }

  /**
   * Get a human readable year.
   */
  function getYear() {
    return ''+ this._day.getYear();
  }

  /**
   * Get a human readable color.
   */
  function getColor() {
    var string = this._day.getColor();
    switch(this._day.getColor()) {
    case 'blue':
      string = 'BLEU';
      break;
    case 'white':
      string = 'BLANC';
      break;
    case 'red':
      string = 'ROUGE';
      break;
    }

    return string;
  }

  /**
   * Publics
   */
  return {
    /**
     * Post to twitter about this Tempo Object.
     */
    'post': function(callback) {
      var msg = config.twitter_msg;
      var date = new Array();
      date.push(getDayOfWeek());
      date.push(getDay());
      date.push(getMonth());
      date.push(getYear());

      msg = msg.replace('%date', date.join(' '));
      msg = msg.replace('%color', getColor());

      var params = {
        token: _twitterToken,
        status: msg
      };

      _twitterClient.apiCall('POST', '/statuses/update.json', params, callback);
    }
  }
}