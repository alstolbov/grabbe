var fs = require('fs');
var util = require('util');
var request = require('superagent');
var cheerio = require('cheerio');
var express = require('express');

var app = express();
var port = 8080;
// var bodyParser = require("body-parser");
//
// app.use(bodyParser.urlencoded({
//   extended: true
// }));


var logFile = fs.createWriteStream('log.txt', { flags: 'w+' });
var logStdout = process.stdout;
var logger = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
};

var buildNodeList = function (bodyArray) {
  var tagList = {};
  getNodes(bodyArray, tagList);

  return tagList;
}

var getNodes = function (nodeArray, tagList) {
  nodeArray.children.map(function (node) {
    if (node.attribs && node.attribs.class) {
      var className = node.attribs.class;
      if (!tagList.hasOwnProperty(className)) {
        tagList[className] = {
          count: 0,
          parent: node.parent && node.parent.attribs && node.parent.attribs.class ? node.parent.attribs.class : false
        };
      }
      tagList[className].count++;

      if (node.children && node.children.length) {
        getNodes(node, tagList);
      }
    }
  });

  return true;
};

var getMaxUsageNodes = function (tagList) {
  var grammar = [];
  // var resGrammar = [];
  // var middle = 0;
  for (prop in tagList) {
    // middle += tagList[prop];
    grammar.push({
      class: prop,
      count: tagList[prop].count,
      parent: tagList[prop].parent
    });
  }
  // middle = middle/grammar.length;
  // grammar.map(function (item) {
  //   if (item.count > middle) {
  //     resGrammar.push({
  //       class: item.class,
  //       count: item.count,
  //       parent: item.parent
  //     });
  //   }
  // });
  grammar.sort(function (a, b) {
      return b.count - a.count;
  });

  return grammar;
};

var getItem = function (opt) {
  var res;
  opt.in.map(function (item) {
    if (item[opt.where] == opt.eq) {
      res = item;
    }
  });

  return res;
}

var getAllParents = function ($, _class, parentsArr) {
  var node = $('.' + _class.split(' ').join('.')).toArray()[0];
  if (node.parent && node.parent.attribs && node.parent.attribs.class) {
    parentsArr.push(node.parent.attribs.class);
    parentsArr = getAllParents($, node.parent.attribs.class, parentsArr);
  }
  return parentsArr;
};

app.get('/', function (_req, _res) {
  if (!_req.query.parse || _req.query.parse == "") {
    _res.send('ready');
  } else {
    request
      .get(_req.query.parse)
      .end(function (err, res) {
        if (!err) {
          var $ = cheerio.load(res.text, {decodeEntities: false});

          // console.log($('body').html());
          var bodyArray = $('body').toArray()[0];
          // getNodes(bodyArray);
          var tagList = buildNodeList(bodyArray);

          var nodes = getMaxUsageNodes(tagList);
          var middle = 0;
          nodes.map(function (tag) {
            middle += tag.count;
          });
          middle = middle/nodes.length;
          var suspectNodes = [];
          nodes.map(function (node) {
            if(node.count > middle && node.parent) {
              node.parentCount = getItem({
                in: nodes,
                where: 'class',
                eq: node.parent
              }).count;
              node.diff = parseInt(node.parentCount*100/node.count);
              if (node.diff < 50) {
                node.isSuspect = true;
                suspectNodes.push(node);
              }
            }
          });

          // nodes.sort(function (a, b) {
          //     return b.diff - a.diff;
          // });
          var maxDiff = 0;
          var maxContent = 0;
          suspectNodes.map(function (tag) {
            var content = $('.' + tag.class.split(' ').join('.')).text();
            tag.content = content.length;
            maxContent += tag.content;
            maxDiff += tag.diff;
            // tag.allParents = getAllParents($, tag.class, []);
          });

          var HTML = '';
          if (!suspectNodes.length) {
            // HTML += 'nothing';
            HTML += $('body').html();
          } else {
            suspectNodes.map(function (tag) {
              if (tag.diff < maxDiff/suspectNodes.length && tag.content) {
                logger(tag.class, tag.count, tag.parent, tag.parentCount, tag.diff + '%', tag.content);
                var tmpText = 'From: ' + tag.class +
                  '<br>count:' + tag.count +
                  '<br>parent:' + tag.parent +
                  '<br>parentCount:' + tag.parentCount +
                  '<br>diff:' + tag.diff + '%' +
                  '<br>content:' + tag.content
                ;
                // logger(tag.allParents);
                // logger();
                HTML += '<div style="margin: 20px; padding: 10px; border: 1px solid #ddd;"><div style="background: #ddd; font-weight: bold;">' +
                  tmpText +
                  '</div>';
                $('.' + tag.class.split(' ').join('.')).each(function (i, el) {
                  HTML += $(this).html();
                  HTML += '<hr>';
                });
                HTML += '</div>'
              }
            });
          }
          _res.send(HTML);
        }
      })
    ;
  }
});

app.listen(port, function () {
  console.log('Example app listening on port ' + port);
});
