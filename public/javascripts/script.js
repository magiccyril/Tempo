// Array of all months.
var months = new Array(
  'Janvier'
  , 'Février'
  , 'Mars'
  , 'Avril'
  , 'Mai'
  , 'Juin'
  , 'Juillet'
  , 'Aout'
  , 'Septembre'
  , 'Octobre'
  , 'Novembre'
  , 'Décembre'
);

// Array of all days.
var days = new Array(
  'Lundi'
  , 'Mardi'
  , 'Mercredi'
  , 'Jeudi'
  , 'Vendredi'
  , 'Samedi'
  , 'Dimanche'
);

// An object representing now.
var now = {
  date: new Date(),
  day: new Date().getDate(),
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
}

// An object the maximum date available.
var max = {
  month: now.month,
  year: now.year,
}

// An object the minimum date available.
var min = {
  month: 9,
  year: 2005
}

/**
 * Helper function to get the previous month of a month.
 *
 * @param month Integer
 * @param year Integer
 * @return object
 */
function getPrevMonth(month, year) {
  var month = parseInt(month, 10);
  var prev_month = month - 1;
  var prev_month_year = year;

  if (prev_month - 1 < 0) {
    prev_month = 12;
    prev_month_year = year - 1;
  }

  return {
    month: prev_month,
    year: prev_month_year,
    toString: months[prev_month - 1] + ' ' + prev_month_year
  }
}

/**
 * Helper function to get the following month of a month.
 *
 * @param month Integer
 * @param year Integer
 * @return object
 */
function getNextMonth(month, year) {
  var month = parseInt(month, 10);
  var next_month = month + 1;
  var next_month_year = year;

  if (next_month - 1 > months.length - 1) {
    next_month = 1;
    next_month_year = next_month_year + 1;
  }

  return {
    month: next_month,
    year: next_month_year,
    toString: months[next_month - 1] + ' ' + next_month_year
  }
}

// object to store all the history structure.
var history_structure;
/**
 * Create all the history strucutre.
 *
 * @param wrapper DOMElement
 * @return object representing the structure.
 */
function createHistoryStructure(wrapper) {
  // create the section header.
  var header = $('<header />');
  header
    .attr({
      'id': 'history-header'
    })
    .appendTo(wrapper);

  // header title.
  var header_title = $('<h3/>');
  header_title
    .appendTo(header)
    .html(months[now.month - 1] + ' ' + now.year);

  // create the previous button.
  var prev_month = getPrevMonth(now.month, now.year);
  var prev = createHistoryButton(prev_month, header, 'btn-prev', 'pull-left');
  prev
    .bind('click', onHistoryButtonClick)
    .bind('changeValues', onPrevButtonChange)
    .trigger('changeValues', prev_month);
  prev.data('icon').addClass('icon-step-backward');

  // create the next button.
  var next_month = getNextMonth(now.month, now.year);
  var next = createHistoryButton(next_month, header, 'btn-next', 'pull-right', false);
  next
    .bind('click', onHistoryButtonClick)
    .bind('changeValues', onNextButtonChange)
    .trigger('changeValues', next_month)
    // first hide the button.
    .hide();
  next.data('icon').addClass('icon-step-forward');

  // create the button to go back to current month.
  var today = createHistoryButton(now, header, 'btn-today', 'center');
  today
    .bind('click', onHistoryButtonClick)
    .hide();
  today.data('text').html("Aujourd'hui");
  today.data('icon').addClass('icon-share-alt');

  // create the table history.
  var table = $('<table />');
  table
    .addClass('table table-bordered')
    .appendTo(wrapper);
  var table_body = $('<tbody />');
  table_body.appendTo(table);

  // table header.
  var table_header = '';
  for (i in days) {
    var day = days[i];
    table_header += '<th>';
      table_header += '<abbr title="'+ day +'">';
        table_header += day.substr(0, 3) +'.';
      table_header += '</abbr>';
    table_header += '</th>';
  }
  table_header = '<thead><tr>' + table_header + '</tr></thead>';
  table.prepend($(table_header));

  // find the alert message.
  var alert = wrapper.find('.alert');

  return {
    alert: alert
    , header: header
    , header_title: header_title
    , next_btn: next
    , prev_btn: prev
    , table: table
    , table_header: table_header
    , today_btn: today
  }
}

/**
 * Helper function to create a DOM Element for a button.
 *
 * @param month Object @see getPrevMonth()
 * @param wrapper Jquery Object
 * @param css_id String
 * @param css_class
 * @return Jquery Object
 */
function createHistoryButton(month, wrapper, css_id, css_class, icon_first) {
  if ('undefined' == typeof css_id) {
    css_id = '';
  }
  if ('undefined' == typeof css_class) {
    css_class = '';
  }
  if ('undefined' == typeof icon_first) {
    icon_first = true;
  }

  var btn = $('<a />');

  var icon = $('<i />');
  var span = $('<span />');

  btn
    .addClass('btn '+ css_class)
    .attr({
      'data-month': month.month
      , 'data-year': month.year
      , 'id': css_id
    });

  if (!icon_first) {
    btn
      .append(span)
      .append(icon);
  }
  else {
    btn
      .append(icon)
      .append(span);
  }

  btn.data({
    'icon': icon
    , 'text': span
  })
  .appendTo(wrapper);

  return btn;
}

/**
 * Callback function when clicking on previous / next / or today buttons.
 */
function onHistoryButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  var new_month = parseInt($(this).attr('data-month'), 10);
  var new_year = parseInt($(this).attr('data-year'), 10);

  // get values.
  get_history(new_year, new_month, function() {
    if (new_year == now.year && new_month == now.month) {
      history_structure.today_btn.hide();
    }
    else {
      history_structure.today_btn.show();
    }

    // change header title.
    history_structure.header_title.html(months[new_month - 1] + ' ' + new_year);

    // change previous button.
    var prev_month = getPrevMonth(new_month, new_year);
    history_structure.prev_btn.trigger('changeValues', prev_month);

    // change next button.
    var next_month = getNextMonth(new_month, new_year);
    history_structure.next_btn.trigger('changeValues', next_month);
  });
}

/**
 * Callback function for the history previous button.
 * called when data changing.
 *
 * @param prev_month @see getPrevMonth().
 */
function onPrevButtonChange(e, prev_month) {
  var $self = $(this);
  $self
    .attr({
      'data-month': prev_month.month
      , 'data-year': prev_month.year
    })
    .data('text').html(prev_month.toString);
  if (prev_month.year <= min.year && prev_month.month < min.month) {
    $self.hide();
  }
  else {
    $self.show();
  }
}

/**
 * Callback function for the history next button.
 * called when data changing.
 *
 * @param next_month @see getNextMonth().
 */
function onNextButtonChange(e, next_month) {
  var $self = $(this);

  $self
    .attr({
      'data-month': next_month.month
      , 'data-year': next_month.year
    })
    .data('text').html(next_month.toString);
  if (next_month.year >= max.year && next_month.month > max.month) {
    $self.hide();
  }
  else {
    $self.show();
  }
}

/**
 * Callback function to display all the values.
 *
 * @param json JSON.
 */
function display_history(json) {
  // empty the table.
  history_structure.table.empty();

  // foreach weeks in jons.
  for (i in json) {
    var week = json[i];

    // create a new line.
    var tr = $('<tr>');

    // foreach days in the week.
    for (j in week) {
      var day = week[j];
      var td = $('<td>');

      // if day is in current month.
      if (day) {
        var html = '';
        html += '<span class="day">'+ day.day +'</span>';
        html += '<span class="color">';
        if (day.color) {
          html += ' ' + day.t_color;
        }
        else {
          html += ' -';
        }
        html += '</span>';

        if (day.color) {
          td.addClass(day.color);
        }
        else {
          td.addClass('no');
        }

        // check if this day is today.
        if (day.year == now.year && day.month == now.month && day.day == now.day) {
          td.addClass('today');
        }

        td.html(html);

        // wrap today inside a mark element.
        if (day.year == now.year && day.month == now.month && day.day == now.day) {
          td.wrapInner('<mark />');
        }
      }
      // day isn't in the current month.
      else {
        td.addClass('out');
      }

      td.appendTo(tr);
    }

    tr.appendTo(history_structure.table);
  }
}

/**
 * Get history values.
 *
 * @param year Integer
 * @param month Integer
 * @param callback Function
 */
function get_history(year, month, callback) {
  var year = parseInt(year, 10);
  var month = parseInt(month, 10);
  if (month < 10) {
    month = '0' + month;
  }

  $.ajax('/webservice.json?year='+ year +'&month='+ month +'&formatted=true', {
    error: function(jqXHR, textStatus, errorThrown) {
      var string = ''+ textStatus + ': '+ errorThrown;
      history_structure.alert.html(string);
      history_structure.alert.slideDown();
    }
    , success: function(json, textStatus, jqXHR) {
      history_structure.alert.slideUp();
      display_history(json);

      if (callback) {
        callback();
      }
    }
  });
}


$(document).ready(function() {
  // fix main nav on scroll
  var $win = $(window)
  , $nav = $('.mainnav')
  , navTop = $('.mainnav').length && $('.mainnav').offset().top - 40
  , isFixed = 0;

  processScroll();

  $win.on('scroll', processScroll);

  function processScroll() {
    var i, scrollTop = $win.scrollTop();
    if (scrollTop >= navTop && !isFixed) {
      isFixed = 1;
      $nav.addClass('mainnav-fixed');
    } else if (scrollTop <= navTop && isFixed) {
      isFixed = 0;
      $nav.removeClass('mainnav-fixed');
    }
  }

  /*
  $('a').smoothScroll({
    offset: -50
  });
  */

  /**
   * History.
   */
  // get the history section.
  var history = $('#history');
  // create the strucutre.
  history_structure = createHistoryStructure(history);
  // hide the javascript alert.
  history_structure.alert.hide();

  // get the values for this month.
  get_history(now.year, now.month);
});