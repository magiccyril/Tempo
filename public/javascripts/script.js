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
  , 'Décembre');
var days = new Array('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');

var now = {
  date: new Date(),
  day: new Date().getDate(),
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
}

var max = {
  month: now.month,
  year: now.year,
}

var min = {
  month: 9,
  year: 2005
}

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
    toString: '&larr; ' + months[prev_month - 1] + ' ' + prev_month_year
  }
}

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
    toString: months[next_month - 1] + ' ' + next_month_year + ' &rarr;'
  }
}

$(document).ready(function () {
  // fix main nav on scroll
  var $win = $(window)
  , $nav = $('.mainnav')
  , navTop = $('.mainnav').length && $('.mainnav').offset().top - 40
  , isFixed = 0;

  processScroll()

  $win.on('scroll', processScroll)

  function processScroll() {
    var i, scrollTop = $win.scrollTop()
    if (scrollTop >= navTop && !isFixed) {
      isFixed = 1
      $nav.addClass('mainnav-fixed')
    } else if (scrollTop <= navTop && isFixed) {
      isFixed = 0
      $nav.removeClass('mainnav-fixed')
    }
  }

  /*
  $('a').smoothScroll({
    offset: -50
  });
  */

  var history = $('#history');
  history.find('.alert-message').hide();

  var header = $('<div />');
  header
    .attr('id', 'history-header')
    .appendTo(history);

  var header_title = $('<h3/>');
  header_title
    .appendTo(header)
    .html(months[now.month - 1] + ' ' + now.year);

  var prev_month = getPrevMonth(now.month, now.year);
  var prev = $('<a />');
  prev
    .addClass('btn pull-left')
    .attr('data-month', prev_month.month)
    .attr('data-year', prev_month.year)
    .attr('id', 'btn-prev')
    .appendTo(header)
    .bind('click', onClick)
    .html(prev_month.toString);
  if (prev_month.year <= min.year && prev_month.month < min.month) {
    prev.hide();
  }

  var next_month = getNextMonth(now.month, now.year);
  var next = $('<a />');
  next
    .addClass('btn pull-right')
    .attr('data-month', next_month.month)
    .attr('data-year', next_month.year)
    .attr('id', 'btn-next')
    .appendTo(header)
    .bind('click', onClick)
    .html(next_month.toString);
  if (next_month.year >= max.year && next_month.month > max.month) {
    next.hide();
  }

  var today = $('<a />');
  today
    .addClass('btn center')
    .appendTo(header)
    .attr('data-month', now.month)
    .attr('data-year', now.year)
    .attr('id', 'btn-today')
    .bind('click', onClick)
    .hide()
    .html("Revenir à aujourd'hui");

  var table = $('<table />');
  table
    .addClass('bordered-table')
    .appendTo(history);

  var table_body = $('<tbody />');
  table_body.appendTo(table);

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

  get_history(today.year, today.month);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    var new_month = parseInt($(this).attr('data-month'), 10);
    var new_year = parseInt($(this).attr('data-year'), 10);

    get_history(new_year, new_month, function() {
      if (new_year == now.year && new_month == now.month) {
        today.hide();
      }
      else {
        today.show();
      }

      header_title.html(months[new_month - 1] + ' ' + new_year);

      var prev_month = getPrevMonth(new_month, new_year);
      prev
        .attr('data-month', prev_month.month)
        .attr('data-year', prev_month.year)
        .html(prev_month.toString);
      if (prev_month.year <= min.year && prev_month.month < min.month) {
        prev.hide();
      }
      else {
        prev.show();
      }

      var next_month = getNextMonth(new_month, new_year);
      next
        .attr('data-month', next_month.month)
        .attr('data-year', next_month.year)
        .html(next_month.toString);
      if (next_month.year >= max.year && next_month.month > max.month) {
        next.hide();
      }
      else {
        next.show();
      }

      var month = parseInt(new_month, 10) < 10 ? '0' + new_month : new_month;
    });
  }

  function display_history(json) {
    table_body.empty();

    for (i in json) {
      var week = json[i];

      var tr = $('<tr>');

      for (j in week) {
        var day = week[j];
        var td = $('<td>');

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

          if (day.year == now.year && day.month == now.month && day.day == now.day) {
            td.addClass('today');
          }

          td.html(html);
        }
        else {
          td.addClass('out');
        }

        td.appendTo(tr);
      }

      tr.appendTo(table_body);
    }
  }

  function get_history(year, month, callback) {
    var year = parseInt(year, 10);
    var month = parseInt(month, 10);
    if (month < 10) {
      month = '0' + month;
    }

    $.ajax('/webservice.json?year='+ year +'&month='+ month +'&formatted=true', {
      success: function (json) {
        display_history(json);

        if (callback) {
          callback();
        }
      }
    });
  }
});