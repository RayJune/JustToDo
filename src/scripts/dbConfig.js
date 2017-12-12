'use strict';
module.exports = (function dbConfigGenerator() {
  var dbConfig = {
    name: 'justToDo',
    version: '6',
    key: 'id',
    storeName: 'user'
  };
  dbConfig.dataDemo = {
    id: 0,
    event: 0,
    finished: true,
    date: 0
  };

  return dbConfig;
}());
