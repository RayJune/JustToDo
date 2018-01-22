import DB from 'indexeddb-crud';
import General from './general';

const Refresh = (() => {
  const storeName = 'aphorism';

  function randomAphorism() {
    const randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(storeName, randomIndex, _parseText);
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
  //   all: () => General.all(randomAphorism),
  //   part: () => General.part(randomAphorism),
  //   clear: General.clear,
  //   random: randomAphorism,
  // };
})();

export default Refresh;
