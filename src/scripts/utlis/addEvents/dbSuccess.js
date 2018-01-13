'use strict';
module.exports = (function addEventsDBSuccess() {
  var eventHandler = require('../eventHandler/dbSuccess');
  var general = require('./general.js');

  return function addEvents() {
    general(eventHandler);
  };
}());
