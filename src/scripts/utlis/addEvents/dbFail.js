'use strict';
var addEvents = (function dbFailGenerator() {
  var eventHandler = require('../eventHandler/dbFail');
  var generator = require('./generator');

  return function handler() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    generator(eventHandler);
  };
}());

module.exports = addEvents;
