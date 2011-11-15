var Tempo = require('./tempo.js');

module.exports = function(options) {

/**
 * Module options
 */
var client = require('redis').createClient()
  , namespace = 'tempo'
  , counter_red_nb = 22
  , counter_white_nb = 43
  , counter_blue_nb = 300;

if ('undefined' != typeof options) {
  _set_options(options);
}

/**
 * Privates
 */

// Get date from key.
function _get_date_from_key(key) {
  return key.substr(namespace.length + 1, 8);
}

// Get object key name for a day.
function _key(date) {
  return namespace + ':' + date + ':color';
}

// Get object key name for a day.
function _key_counter(color) {
  return namespace + ':counter:' + color;
}

// Update internal options.
function _set_options(options) {
  if ('undefined' != typeof options.database) {
    client.select(options.database);
  }
  if ('undefined' != typeof options.namespace) {
    namespace = options.namespace;
  }
  if ('undefined' != typeof options.counter_red_nb) {
    counter_red_nb = options.counter_red_nb;
  }
  if ('undefined' != typeof options.counter_white_nb) {
    counter_white_nb = options.counter_white_nb;
  }
  if ('undefined' != typeof options.counter_blue_nb) {
    counter_blue_nb = options.counter_blue_nb;
  }

  return this;
}

// Reset a color counter.
function reset_counter(color, value) {
  client.set(_key_counter(color), value, function(err, ok) {
    if (!err && 'OK' == ok) {
      return true;
    }
    return err;
  });
}

// Decrement the color counter.
function decr_counter(color) {
  client.decr(_key_counter(color), function(err, value) {
    if (!err) {
      return value;
    }
    return err;
  });
}

return {
  /**
   * Update options
   */
  'configure': _set_options,

  /**
   * Allow disconnection
   */
  'close': function disconnect(callback) {
    if (client.connected) {
      client.quit();
    }
    if (callback) {
      client.on('close', callback);
    }
  },

  /**
   * Retrieve a list of keys.
   * callback is called with (err, values)
   */
  'fetchKeys': function fetchKeys(date, callback) {
    client.keys(_key(date), function(err, values) {
      if (err) {
        return callback(err);
      }

      return callback(err, values.sort());
    });
  },

  /**
   * Retrieve a tempo object for a day.
   * callback is called with (err, day)
   * if no object is found, an error is raised with type = ENOTFOUND
   */
  'fetchDay': function fetchDay(date, callback) {
    client.get(_key(date), function (err, value) {
      if (!err && !value) {
        err = {
          'message': 'Object not found',
          'type': 'ENOTFOUND'
        };
      }
      if (err) {
        return callback(err);
      }

      try {
        var day = new Tempo();
        day.setDate(date);
        day.setColor(value);
      } catch (e) {
        return callback(e);
      }
      return callback(undefined, day);
    });
  },

  /**
   * Retrieve a tempo object for a complete month
   * callback is called with (err, month)
   */
  'fetchMonth': function fetchMonth(date, callback) {
    // ensure date is in format YYYYMM
    date = date.substr(0, 6);
    // append wilcard to date to get keys.
    date += '*';

    this.fetchKeys(date, function(err, keys) {
      if (err) {
        return callback(err);
      }

      client.mget(keys, function(err, values) {
        if (err) {
          return callback(err);
        }

        var month = new Array();

        try {
          for (var i in keys) {
            if (values[i]) {
              var day_date = _get_date_from_key(keys[i]);
              var day = new Tempo();
              day.setDate(day_date);
              day.setColor(values[i]);
              month.push(day);
            }
            else {
              month.push(false);
            }
          }
        } catch (e) {
          return callback(e);
        }

        return callback(undefined, month);
      });
    });
  },

  /**
   * Retrieve tempo colors for all days.
   * callback is called with (err, values)
   */
  'fetchAll': function fetchAll(callback) {
    this.fetchKeys('*', function(err, keys) {
      if (err) {
        return callback(err);
      }

      client.mget(keys, function(err, values) {
        if (err) {
          return callback(err);
        }

        var all = new Array();
        for (var i in values) {
          var date = _get_date_from_key(keys[i]);
          all.push({
            color: values[i],
            date: date,
          });
        }

        return callback(undefined, all);
      });
    });
  },

  /**
   * Retrieve a color counter.
   * callback is called with (err, counter)
   */
  'fetchCounter': function fetchCounter(color, callback) {
    client.get(_key_counter(color), function(err, counter) {
      if (err) {
        return callback(err);
      }

      return callback(undefined, counter);
    });
  },

  /**
   * Save a tempo object
   * check if object exist to determine if it's an insertion or an update
   * callback is called with (err, tempo)
   */
  'save': function save(tempo, callback) {
    var self = this;

    if (!tempo.getDate() || !tempo.getColor()) {
      return callback({
        'message': 'Object undefined',
        'type': 'EUNDEFINED'
      });
    }

    var onReady = function() {
      client.set(_key(tempo.getDate()), tempo.getColor(), function (err) {
        return callback(err, tempo);
      });
    }

    this.fetchDay(tempo.getDate(), function(err, old) {
      // object found, it's an update.
      if (!err) {
        for (var attr in tempo) {
          old[attr] = tempo[attr];
        }
        tempo = old;
      }
      // else it's a creation
      else {
        // on september 1st, reset counters.
        if (9 == tempo.getMonth()) {
          reset_counter('red', counter_red_nb);
          reset_counter('white', counter_white_nb);
          if (tempo.isInLeapYear()) {
            reset_counter('blue', counter_blue_nb + 1);
          }
          else {
            reset_counter('blue', counter_blue_nb);
          }
        }

        // decrement color's counter.
        decr_counter(tempo.getColor());
      }

      onReady();
    });
  }
}
};