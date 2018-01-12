module.exports = function clearChildNodes(root) {
  var temp = root.cloneNode(false);

  root.parentNode.replaceChild(temp, root);
};
