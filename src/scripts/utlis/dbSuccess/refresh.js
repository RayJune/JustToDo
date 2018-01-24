import DB from 'indexeddb-crud';
import General from '../dbGeneral/refreshGeneral';

const Refresh = (() => {
  function randomAphorism() {
    const storeName = 'aphorism';
    const randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(randomIndex, _parseText, storeName);
  }

  function _parseText(data) {
    const text = data.content;

    General.sentenceHandler(text);
  }

  return {
    init: General.init,
    all: General.all.bind(null, randomAphorism), // PUNCHLINE: use bind to pass paramter
    part: General.part.bind(null, randomAphorism),
    clear: General.clear,
    random: randomAphorism,
  };
  // return {
  //   init: General.init,
  //   FIXME: why this method can't work
  //   all: () => General.all(randomAphorism),
  //   part: () => General.part(randomAphorism),
  //   clear: General.clear,
  //   random: randomAphorism,
  // };
})();

export default Refresh;
