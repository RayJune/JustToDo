import addEventsGenerator from '../dbGeneral/addEventsGenerator';
import eventsHandler from '../dbFail/eventsHandler';

function addEvents() {
  window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
  addEventsGenerator(eventsHandler);
}

export default addEvents;
