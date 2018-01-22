'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _general = require('./general');

var _general2 = _interopRequireDefault(_general);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Refresh = function () {
  function randomAphorism() {
    var aphorisms = ['Yesterday You Said Tomorrow', 'Why are we here?', 'All in, or nothing', 'You Never Try, You Never Know', 'The unexamined life is not worth living. -- Socrates', 'There is only one thing we say to lazy: NOT TODAY'];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = aphorisms[randomIndex];

    _general2.default.sentenceHandler(text);
  }

  return {
    init: _general2.default.init,
    all: _general2.default.all.bind(null, randomAphorism),
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
//# sourceMappingURL=dbFail.js.map