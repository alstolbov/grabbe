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
var apiText = ''

app.get('/', function (_req, _res) {
  if (!_req.query.parse || _req.query.parse == "") {
    _res.sendFile(__dirname + '/help.html');
  } else {
    request
      .get(_req.query.parse)
      .end(function (err, res) {
        if (err) {
          _res.send('error connect to ' + req.query.parse);
        } else {
          grabbe.parse(
            {
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
