'use strict';
module.exports = (function addEventsDBFail() {
  var eventHandler = require('../eventHandler/dbFail.js');
  var general = require('./general.js');

  return function addEvents() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    general(eventHandler);
  };
}());
