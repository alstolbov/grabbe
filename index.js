var express = require('express');
var app = express();

var request = require('superagent');
var grabbe = require('./grabbe.js');
var port = 8080;

// var bodyParser = require("body-parser");
//
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

var parseHost = function (str) {
  var res = getLocation(str);
  if (!res) {
    res = getLocation('http://' + str);
  }

  return res;
}

function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7],
        full: href
    };
}

app.get('/', function (_req, _res) {
  if (!_req.query.parse || _req.query.parse == "") {
    _res.sendFile(__dirname + '/help.html');
  } else {
    var _path = parseHost(_req.query.parse);
    var _host;
    if (_path) {
      _host = _path.protocol + '//' + _path.host + '/' + (_path.port ? _path.port : "")
    } else {
      _host = _req.query.parse;
    }
    request
      .get(
        _path ? _path.full : _req.query.parse
      )
      .end(function (err, res) {
        if (err) {
          _res.send('error connect to ' + req.query.parse);
        } else {
          grabbe.parse(
            {
              host: _host,
              text: res.text,
              diff: _req.query.diff || 50,
              limit: _req.query.limit || 0,
              skip: _req.query.skip || 0,
              parent: _req.query.parent || false
            },
            function (err, text) {
            _res.send(
              '<!DOCTYPE html>\
              <html>\
                <head>\
                  <meta charset=utf-8 />\
                  <title>Parse ' + _req.query.parse + '</title>\
                </head>\
                <body>' +
                text +
                '</body>\
              </html>'
            );
            }
          );

        }
      })
    ;
  }
});

app.listen(port, function () {
  console.log('Parser listening on port ' + port);
});
