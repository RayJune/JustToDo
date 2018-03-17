import General from '../dbGeneral/refreshGeneral';

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


export default {
  init: General.init,
  clear: General.clear,
  random: randomAphorism,
};
