/**
 * Created by channing on 14-9-12.
 */

var Buffer = require('buffer').Buffer;
var Crypto = require('crypto');

function authcode(str, operation, key, expiry) {
  var operation = operation ? operation : 'DECODE';
  var key = key ? key : '';
  var expiry = expiry ? expiry : 0;

  var ckey_length = 4;

  var keya = md5(key.substr(0, 16));

  var keyb = md5(key.substr(16, 16));

  var keyc = ckey_length ? (operation == 'DECODE' ? str.substr(0, ckey_length) :
    md5(microtime()).substr(-ckey_length)) : '';

  var cryptkey = keya + md5(keya + keyc);

  var strbuf;
  if (operation == 'DECODE') {
    str = str.substr(ckey_length);
    strbuf = new Buffer(str, 'base64');
  } else {
    expiry = expiry ? expiry + time() : 0;
    tmpstr = expiry.toString();
    if (tmpstr.length >= 10)
      str = tmpstr.substr(0, 10) + md5(str + keyb).substr(0, 16) + str;
    else {
      var count = 10 - tmpstr.length;
      for (var i = 0; i < count; i++) {
        tmpstr = '0' + tmpstr;
      }
      str = tmpstr + md5(str + keyb).substr(0, 16) + str;
    }
    strbuf = new Buffer(str);
  }

  var box = [];
  for (var i = 0; i < 256; i++) {
    box[i] = i;
  }
  var rndkey = [];
  for (var i = 0; i < 256; i++) {
    rndkey[i] = cryptkey.charCodeAt(i % cryptkey.length);
  }
  for (var j = i = 0; i < 256; i++) {
    j = (j + box[i] + rndkey[i]) % 256;
    tmp = box[i];
    box[i] = box[j];
    box[j] = tmp;
  }


  var s = '';
  for (var a = j = i = 0; i < strbuf.length; i++) {
    a = (a + 1) % 256;
    j = (j + box[a]) % 256;
    tmp = box[a];
    box[a] = box[j];
    box[j] = tmp;
    strbuf[i] = strbuf[i] ^ (box[(box[a] + box[j]) % 256])
  }

  if (operation == 'DECODE') {
    var s = strbuf.toString();
    if ((s.substr(0, 10) == 0 || s.substr(0, 10) - time() > 0) && s.substr(10,
        16) == md5(s.substr(26) + keyb).substr(0, 16)) {
      s = s.substr(26);
    } else {
      s = '';
    }

  } else {
    var s = strbuf.toString('base64');

    var regex = new RegExp('=', "g");
    s = s.replace(regex, '');
    s = keyc + s;
  }

  return s;

  function microtime(get_as_float) {
    var unixtime_ms = new Date().getTime();
    var sec = parseInt(unixtime_ms / 1000);
    return get_as_float ? (unixtime_ms / 1000) : (unixtime_ms - (sec * 1000)) /
      1000 + ' ' + sec;
  }

  function time(date) {
    date = new Date(date);
    return Math.floor(date.getTime() / 1000);
  }

  function md5(str) {

    var buf = new Buffer(1024);
    var len = buf.write(str, 0);
    str = buf.toString('binary', 0, len);

    var md5sum = Crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
  }
}

module.exports = authcode;
