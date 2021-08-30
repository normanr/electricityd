var re_watts = /<ch1><watts>(0*)(\d+)<\/watts><\/ch1>/;
var re_temp = /<tmpr> *([\-\d.]+)<\/tmpr>/;
var re_time = /<time>([\-\d:]+)<\/time>/;
var re_demand = /<rainforest[^>]* timestamp="(\d+)s"[^>]*>.*?<InstantaneousDemand>.*?<Demand>((?:0[xX])?[\dA-Fa-f]+)<\/Demand>.*?<Multiplier>((?:0[xX])?[\dA-Fa-f]+)<\/Multiplier>.*?<Divisor>((?:0[xX])?[\dA-Fa-f]+)<\/Divisor>.*?<\/InstantaneousDemand>.*?<\/rainforest>/;
var re_tempered = /<tempered[^>]*>.*?<temperature>([\-\d.]+)<\/temperature>.*?<relative_humidity>([\-\d.]+)<\/relative_humidity>.*?<\/tempered>/;

window.onerror = function(message, source, lineno, colno, error) {
  msg = source + ':' + lineno + ':' + colno + ':' + message;
  $('#error').prepend($('<span>').text(msg + '\n'));
};

function updateReadings(timestamp) {
  $.get('log', {'ts': timestamp}, function(data) {
    output = '';
    log = data['log'];
    for (i in log) {
      line = log[i];
      var watts = re_watts.exec(line);
      if (watts) {
        $('#watts').text(watts[1].replace(/0/g, ' ') + watts[2]);
      }
      var temp = re_temp.exec(line);
      if (temp) {
        $('#temp').text(temp[1]);
      }
      var time = re_time.exec(line);
      if (time) {
        $('#time').text(time[1]);
      }
      var idemand = re_demand.exec(line);
      if (idemand) {
        var i = 0;
        var timestamp = new Date(parseInt(idemand[++i]) * 1000);
        $('#time').text(timestamp.toLocaleTimeString());
        var demand = parseInt(idemand[++i]) * parseInt(idemand[++i]) / parseInt(idemand[++i]) * 1000;
        $('#watts').text('     '.slice(demand.toFixed().length) + demand.toFixed());
      }
      var tempered = re_tempered.exec(line);
      if (tempered) {
        var i = 0;
        var temp = parseFloat(tempered[++i]);
        $('#temp').text(temp.toFixed(1));
        var humid = parseFloat(tempered[++i]);
        $('#humid').text(humid.toFixed(1));
      }
      output = line + output;
    }
    if (output && window.location.hash) {
      $('#log').prepend($('<span>').text(output));
    }
    setTimeout(updateReadings, data['delay'] * 1000, data['ts']);
  }).fail(function(xhr, status, error) {
      msg = 'Updates paused, refresh to resume.';
      if (error) {
        msg = 'Request failed: ' + error + '.  ' + msg
      }
      $('#error').prepend($('<span>').text(msg + '\n'));
  });
}

function updateHistory() {
  var units = ['h', 'd', 'm'];
  for (var i in units) {
    var unit = units[i];

    var wrapper = new google.visualization.ChartWrapper({
      chartType: 'LineChart',
      containerId: 'chart_' + unit,
      dataSourceUrl: 'hist.gviz?sensor=0&unit=' + unit,
      // refreshInterval: 30,  // requires tqrt=scriptInjection as part of url
      options: {
        backgroundColor: { fill: 'none' },
        colors: ['black'],
        hAxis: {
          baselineColor: 'none',
          gridlines: { color: 'none' },
        },
        legend: 'none',
        theme: 'maximized',
        vAxis: {
          baselineColor: 'none',
          gridlines: { color: 'none' },
          minValue: 0,
          title: 'kWh/' + unit,
        },
      },
    });

    google.visualization.events.addListener(wrapper, 'error', function(e) {
      msg = 'History update failed, refresh to resume.';
      if (e.message) {
        error = 'Error in query: ' + e.message;
        msg = 'Request failed: ' + error + '.  ' + msg;
      }
      $('#error').prepend($('<span>').text(msg + '\n'));
    });

    wrapper.draw();
  };
}

function loadModules() {
  // Load the Visualization API, the corechart package and set a callback.
  google.load('visualization', '1.0', {'packages':['corechart'], 'callback': updateHistory});
}

function initLoader() {
  var script = document.createElement("script");
  script.src = "//www.google.com/jsapi?callback=loadModules";
  document.getElementsByTagName("head")[0].appendChild(script);
}

$(function() {
  initLoader();
  updateReadings();
});
