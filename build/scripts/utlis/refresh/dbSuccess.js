'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexeddbCrud = require('indexeddb-crud');

var _indexeddbCrud2 = _interopRequireDefault(_indexeddbCrud);

var _general = require('./general');

var _general2 = _interopRequireDefault(_general);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Refresh = function () {
  var storeName = 'aphorism';

  function randomAphorism() {
    var randomIndex = Math.ceil(Math.random() * _indexeddbCrud2.default.getLength(storeName));

    _indexeddbCrud2.default.getItem(storeName, randomIndex, _parseText);
  }

  function _parseText(data) {
    var text = data.content;

    _general2.default.sentenceHandler(text);
  }

  return {
    init: _general2.default.init,
    all: _general2.default.all.bind(null, randomAphorism), // PUNCHLINE: use bind to pass paramter
    part: _general2.default.part.bind(null, randomAphorism),
    clear: _general2.default.clear,
    random: randomAphorism
  };
  // return {
  //   init: General.init,
  //   all: () => General.all(randomAphorism),
  //   part: () => General.part(randomAphorism),
  //   clear: General.clear,
  //   random: randomAphorism,
  // };
}();

exports.default = Refresh;
//# sourceMappingURL=dbSuccess.js.map