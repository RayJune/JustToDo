'use strict';
module.exports = function withoutDB() {
  var element = document.createElement('script');

  element.type = 'text/javascript';
  // element.async = true;
  element.src = './withoutDB.js';
  document.body.appendChild(element);
};
