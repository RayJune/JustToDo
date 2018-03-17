import DB from 'indexeddb-crud';
import General from '../dbGeneral/refreshGeneral';

function randomAphorism() {
  const storeName = 'aphorism';
  const randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

  DB.getItem(randomIndex, storeName)
    .then(_parseText);
}

function _parseText(data) {
  const text = data.content;

  General.sentenceHandler(text);
}


export default {
  init: General.init,
  all: General.all.bind(null, randomAphorism), // PUNCHLINE: use bind to pass paramter
  part: General.part.bind(null, randomAphorism),
  clear: General.clear,
  random: randomAphorism,
};
