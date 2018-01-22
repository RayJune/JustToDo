'use strict';
function lazyLoadWithoutDB() {
  var element = document.createElement('script');

  element.type = 'text/javascript';
  element.async = true;
  element.src = './dist/scripts/lazyLoad.min.js';
  document.body.appendChild(element);
}

module.exports = lazyLoadWithoutDB;
