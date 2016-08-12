var fs = require('fs');
var util = require('util');

var logger = {
  init: function (fileName) {
    this.logFile = fs.createWriteStream(fileName, { flags: 'w+' });
    this.logStdout = process.stdout;
  },
  log: function () {
    this.logFile.write(util.format.apply(null, arguments) + '\n');
    this.logStdout.write(util.format.apply(null, arguments) + '\n');
  }
};
var _logger = function (fileName) {
  logger.init(fileName);
  return logger;
}
module.exports = _logger;
