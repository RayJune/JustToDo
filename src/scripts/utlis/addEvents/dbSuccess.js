'use strict';
var addEvents = (function dbSuccessGenerator() {
  var eventHandler = require('../eventHandler/dbSuccess');
  var generator = require('./generator');

  return function handler() {
    generator(eventHandler);
  };
}());

module.exports = addEvents;
