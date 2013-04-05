var re_watts = /<ch1><watts>(0*)(\d+)<\/watts><\/ch1>/;
var re_temp = /<tmpr> *([\-\d.]+)<\/tmpr>/;
var re_time = /<time>([\-\d:]+)<\/time>/;

function update(lastTimestamp) {
  $.get('log', {'ts': lastTimestamp}, function(data) {
    output = '';
    sleep = 6000;
    log = data['log'];
    now = data['now'];
    for (i in log) {
      entry = log[i];
      read_start = entry[0];
      read_duration = entry[1];
      line = entry[2];
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
      read_end = read_start + read_duration;
      // current cost generates a new reading every 6 seconds.
      sleep = read_end - now + 6;
      //line = sleep + ',' + line;
      output = line + output;
      lastTimestamp = read_start;
    }
    if (output && window.location.hash) {
      $('#log').prepend($('<span>').text(output));
    }
    setTimeout(update, sleep * 1000, lastTimestamp);
  }).fail(function(xhr, status, error) {
      msg = 'Updates paused, refresh to resume.';
      if (error) {
        msg = 'Request failed: ' + error + '.  ' + msg
      }
      $('#log').prepend($('<span>').text(msg + '\n'));
  });
}

$(function() {
    update();
});
