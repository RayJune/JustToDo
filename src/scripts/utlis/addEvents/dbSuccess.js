import generator from './generator';
import EventHandler from '../eventHandler/dbSuccess';

function addEvents() {
  generator(EventHandler);
}

export default addEvents;
