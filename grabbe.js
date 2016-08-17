var logger = require('./logger.js');
var cheerio = require('cheerio');

var _console = logger('log.txt');

var $;
var bodyArray;

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
  for (prop in tagList) {
    grammar.push({
      class: prop,
      count: tagList[prop].count,
      parent: tagList[prop].parent
    });
  }
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

var getClass = function (classString) {
  return '.' + classString.replace(/ +(?= )/g,'').trim().split(' ').join('.')
}

var addHostToLink = function (srcText, host) {
  var reg = new RegExp('href="/', 'ig');
  return srcText.replace(reg, 'href="' + host + '/');
}

var parse = function (_opt, _next) {
  $ = cheerio.load(_opt.text, {decodeEntities: false});
  // console.log($('body').html());
  bodyArray = $('body').toArray()[0];
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
      if (node.diff < _opt.diff) {
        node.isSuspect = true;
        suspectNodes.push(node);
      }
    }
  });

  var maxDiff = 0;
  suspectNodes.map(function (tag) {
    maxDiff += tag.diff;
  });

  var HTML = '';
  if (!suspectNodes.length) {
    HTML += 'nothing';
    // HTML += _this.$('body').html();
  } else {
    suspectNodes.map(function (tag) {
      var limited = 0;
      if (tag.diff < maxDiff/suspectNodes.length) {
        _console.log(tag.class, tag.count, tag.parent, tag.parentCount, tag.diff + '%', tag.content);
        var tmpText = 'From: ' + tag.class +
          '<br>count:' + tag.count +
          '<br>parent:' + tag.parent +
          '<br>parentCount:' + tag.parentCount +
          '<br>diff:' + tag.diff + '%'
        ;
        // logger(tag.allParents);
        // logger();
        HTML += '<div style="margin: 20px; padding: 10px; border: 1px solid #ddd;"><div style="background: #ddd; font-weight: bold;">' +
          tmpText +
          '</div>';
        if (_opt.parent && getClass(_opt.parent) == getClass(tag.class) || !_opt.parent) {
          $(getClass(tag.class)).each(function (i, el) {
            var isNeed = true;
            if (
              (_opt.limit && limited >= _opt.limit) ||
              (_opt.skip && i <= _opt.skip)
            ) {
              isNeed = false;
            }
            if (isNeed) {
              HTML += $(this).html();
              HTML += '<hr style="margin: 20px 0;">';
              limited++;
            }
          });
        }
        HTML += '</div>'
      }
    });
  }
  // var childs = getAllChildrens($(getClass('item')).toArray()[0]);
  // _console.log(childs);
  _next(null, addHostToLink(HTML, _opt.host));
};


var Grabbe = {
  parse: parse
};

module.exports = Grabbe;
