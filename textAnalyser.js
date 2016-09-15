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

var delDoubleTextAsSimpleLink = function (srcItems, clearTextItems) {
  var res = [];
  clearTextItems.map(function(currTag, currTagIter) {
    var tmpItems = [];
    currTag.items.map(function (currItem, currItemIter) {
      var isAdd = true;
      clearTextItems.map(function (commonTag, commonTagIter) {
        if (commonTagIter !== currTagIter) {
          commonTag.items.map(function (commonItem) {
            if (
              (commonItem.indexOf(currItem) + 1) &&
              commonItem.length > currItem.length
            ) {
              isAdd = false;
            }
          });
        }
      });
      if (isAdd) {
        tmpItems.push(srcItems[currTagIter].items[currItemIter]);
      }
    });
    if (tmpItems.length) {
      res.push({
        parent: currTag.parent,
        items: tmpItems
      });
    }
  });

  return res;
};

module.exports = function (src) {
  var res = [];
  var clearTextRes = [];
  src.data.map(function (tag) {
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
  if (src.noLinks) res = delDoubleTextAsSimpleLink(res, clearTextRes);
  // _console.log(clearTextRes);
  return res;
};
