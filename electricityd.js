var re_watts = /<ch1><watts>(0*)(\d+)<\/watts><\/ch1>/;
var re_temp = /<tmpr> *([\-\d.]+)<\/tmpr>/;
var re_time = /<time>([\-\d:]+)<\/time>/;

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

$(function() {
  updateReadings();
});
