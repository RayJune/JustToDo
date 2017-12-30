'use strict';
module.exports = (function handlerGenerator() {
  // var dbSuccess = require('./dbSuccess.js');
  var dbFail = require('./dbFail.js');

  return {
    // dbSuccess: dbSuccess
    dbFail: dbFail
  };
}());
