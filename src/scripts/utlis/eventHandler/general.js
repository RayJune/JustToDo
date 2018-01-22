import getFormatDate from '../getFormatDate';

const General = (() => {
  const ifEmpty = {
    removeInit: function removeInit() {
      const list = document.querySelector('#list');

      if (list.firstChild.className === 'aphorism') {
        list.removeChild(list.firstChild);
      }
    },
  };

  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: getFormatDate('MM月dd日hh:mm'),
    };
  }

  return {
    ifEmpty,
    resetInput,
    dataGenerator,
  };
})();

export default General;
