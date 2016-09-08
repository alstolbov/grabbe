var logger = require('./logger.js');
var cheerio = require('cheerio');

var MIN_TEXT = 100;
var MIN_LINK_TEXT = 10;
var _console = logger('log.txt');

var textRules = function (htmlPiece) {
  var res = false;
  var $ = cheerio.load(htmlPiece, {decodeEntities: false});
  var clearText = $.root().text();

  if (clearText !== '') {
    if (clearText.length > MIN_TEXT) {
      res = res || true;
    } else if (
      $.root().find('a').length &&
      clearText.length > MIN_LINK_TEXT
    ) {
      res = res || true;
    }
  }
  return res ? clearText : res;
};

module.exports = function (src) {
  var res = [];
  var clearTextRes = [];
  src.map(function (tag) {
    var tmpItems = [];
    var clearTextTmpItems = [];
    tag.items.map(function (item) {
      var testText = textRules(item);
      if (testText) {
        tmpItems.push(item);
        clearTextTmpItems.push(testText);
      }
    });
    if (tmpItems.length) {
      res.push({
        parent: tag.parent,
        items: tmpItems
      });
      clearTextRes.push({
        parent: tag.parent,
        items: clearTextTmpItems
      });
    }
  });
  _console.log(clearTextRes);
  return res;
};
