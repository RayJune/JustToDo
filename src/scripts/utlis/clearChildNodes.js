'use strict';
function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

module.exports = clearChildNodes;
