'use strict';

var _indexeddbCrud = require('indexeddb-crud');

var _config = require('./db/config');

var _config2 = _interopRequireDefault(_config);

var _template = require('../../templete/template');

var _template2 = _interopRequireDefault(_template);

var _dbSuccess = require('./utlis/addEvents/dbSuccess');

var _dbSuccess2 = _interopRequireDefault(_dbSuccess);

var _lazyLoadWithoutDB = require('./utlis/lazyLoadWithoutDB');

var _lazyLoadWithoutDB2 = _interopRequireDefault(_lazyLoadWithoutDB);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _template2.default)();
// open DB, and when DB open succeed, invoke initial function
(0, _indexeddbCrud.open)(_config2.default, _dbSuccess2.default, _lazyLoadWithoutDB2.default);
//# sourceMappingURL=main.js.map