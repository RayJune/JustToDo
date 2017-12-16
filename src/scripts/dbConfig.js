'use strict';
module.exports = (function dbConfigGenerator() {
  var dbConfig = {
    name: 'JustToDo',
    version: '11',
    key: 'id',
    storeName: 'list',
    initialData: [{
      id: 0,
      event: 0,
      finished: true,
      date: 0
    },
    {
      id: 1,
      event: 1,
      finished: true,
      date: 0
    }],
    initialDataUseful: false
  };

  return dbConfig;
}());
