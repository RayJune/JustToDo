import General from '../dbGeneral/refreshGeneral';

const Refresh = (() => {
  function randomAphorism() {
    const aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates',
      'There is only one thing we say to lazy: NOT TODAY',
    ];
    const randomIndex = Math.floor(Math.random() * aphorisms.length);
    const text = aphorisms[randomIndex];

    General.sentenceHandler(text);
  }

  return {
    init: General.init,
    all: General.all.bind(null, randomAphorism),
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
