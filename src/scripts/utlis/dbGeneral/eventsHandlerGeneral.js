import getFormatDate from '../getFormatDate';

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


export default {
  resetInput,
  dataGenerator,
};
