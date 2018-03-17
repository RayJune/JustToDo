import { open as openDB } from 'indexeddb-crud';
import config from './db/config';
import templete from '../templete/template';
import addEvents from './utlis/dbSuccess/addEvents';
import lazyLoadWithoutDB from './utlis/lazyLoadWithoutDB';


templete();
// open DB, and when DB open succeed, invoke initial function
// when failed, change to withoutDB mode
openDB(config)
  .then(addEvents)
  .catch(lazyLoadWithoutDB);
