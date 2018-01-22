import { open as openDB } from 'indexeddb-crud';
import config from './db/config';
import templete from '../../templete/template';
import addEvents from './utlis/addEvents/dbSuccess';
import lazyLoadWithoutDB from './utlis/lazyLoadWithoutDB';


templete();
// open DB, and when DB open succeed, invoke initial function
openDB(config, addEvents, lazyLoadWithoutDB);
