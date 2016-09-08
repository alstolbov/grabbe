var express = require('express');
var app = express();

var request = require('superagent');
var grabbe = require('./grabbe.js');
var textAnalyser = require('./textAnalyser.js');
var port = 8080;

// var bodyParser = require("body-parser");
//
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

var parseHost = function (str) {
  if (str.indexOf('http://') < 0 && str.indexOf('https://')) {
    str = 'http://' + str;
  }
  if (str.slice(-1) !== '') {
    str = str + '/';
  }
  var res = getLocation(str);

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

function asHTML (src) {
  var HTML = '';
  src.text.map(function (tag) {
    HTML += '<div>' + tag.parent + '</div><div>';
    var limited = 0;
    var isNeed = true;
    tag.items.map(function (item, i) {
      if (
        (src.limit && limited >= src.limit) ||
        (src.skip && i <= src.skip)
      ) {
        isNeed = false;
      }
      if (isNeed) {
        HTML += item;
        HTML += '<hr style="margin: 20px 0;">';
        limited++;
      }
    });
    HTML += '</div><br><br><br>';
  });

  return HTML;
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
          _res.send('error connect to ' + _req.query.parse);
        } else {
          grabbe.parse(
            {
              host: _host,
              text: res.text,
              diff: _req.query.diff || 50,
              limit: _req.query.limit || 0,
              skip: _req.query.skip || 0,
              parent: _req.query.parent || false,
              // view: _req.query.view || 'json'
              view: 'json'
            },
            function (err, text) {
              var resText = text
              if (_req.query.analyse == 'analyse') {
                resText = textAnalyser({
                  data: text,
                  noLinks: _req.query.noLinks || false
                });
              }
              if (_req.query.view == 'html') {
                  _res.send(
                    '<!DOCTYPE html>\
                    <html>\
                      <head>\
                        <meta charset=utf-8 />\
                        <title>Parse ' + _req.query.parse + '</title>\
                      </head>\
                      <body>' +
                      asHTML({
                        text: resText,
                        skip: _req.query.skip || 0,
                        limit: _req.query.limit || 0
                      }) +
                      '</body>\
                    </html>'
                  );
              } else if (_req.query.view == 'json') {
                 _res.json(resText);
              }
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
