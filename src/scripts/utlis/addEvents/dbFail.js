import generator from './generator';
import EventHandler from '../eventHandler/dbFail';

function addEvents() {
  window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
  generator(EventHandler);
}

export default addEvents;
