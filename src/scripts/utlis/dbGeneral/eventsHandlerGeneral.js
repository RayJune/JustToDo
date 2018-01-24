import getFormatDate from '../getFormatDate';

const eventsHandlerGeneral = (() => {
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
    resetInput,
    dataGenerator,
  };
})();

export default eventsHandlerGeneral;
