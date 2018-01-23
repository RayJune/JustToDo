import addEventsGenerator from '../dbGeneral/addEventsGenerator';
import eventsHandler from '../dbSuccess/eventsHandler';

function addEvents() {
  addEventsGenerator(eventsHandler);
}

export default addEvents;
