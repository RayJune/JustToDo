'use strict';
module.exports = (function aphorismDBConfigGenerator() {
  var aphorismDBConfig = {
    name: 'JustToDo',
    version: '1',
    key: 'id',
    storeName: 'aphorism'
  };
  aphorismDBConfig.initialData = require('./aphorismData.json');
  // aphorismDB.initialData = [
  //   {
  //     "id": 0,
  //     "content": "Welcome~, try to add your first to-do list : )"
  //   },
  //   {
  //     "id": 1,
  //     "content": "Yesterday You Said Tomorrow"
  //   },
  //   {
  //     "id": 2,
  //     "content": "Why are we here?"
  //   },
  //   {
  //     "id": 3,
  //     "content": "All in, or nothing"
  //   },
  //   {
  //     "id": 4,
  //     "content": "You Never Try, You Never Know"
  //   },
  //   {
  //     "id": 5,
  //     "content": "The unexamined life is not worth living. -- Socrates"
  //   }
  // ];
  aphorismDBConfig.initialDataUseful = true;

  return aphorismDBConfig;
}());