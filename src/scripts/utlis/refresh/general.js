import itemGenerator from '../templete/itemGenerator';
import sentenceGenerator from '../templete/sentenceGenerator';
import clearChildNodes from '../clearChildNodes';

const General = (() => {
  function init(dataArr) {
    _show(dataArr, _initSentence, _renderAll);
  }

  function _show(dataArr, showSentenceFunc, generateFunc) {
    if (!dataArr || dataArr.length === 0) {
      showSentenceFunc();
    } else {
      document.querySelector('#list').innerHTML = generateFunc(dataArr);
    }
  }

  function _initSentence() {
    const text = 'Welcome~, try to add your first to-do list : )';

    document.querySelector('#list').innerHTML = sentenceGenerator(text);
  }

  function all(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderAll);
  }

  function _renderAll(dataArr) {
    const classifiedData = _classifyData(dataArr);

    return itemGenerator(classifiedData);
  }

  function _classifyData(dataArr) {
    const finished = [];
    const unfishied = [];

    // put the finished item to the bottom
    dataArr.forEach(data => (data.finished ? finished.push(data) : unfishied.push(data)));

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return itemGenerator(dataArr);
  }

  function clear() {
    clearChildNodes(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    const rendered = sentenceGenerator(text);

    document.querySelector('#list').innerHTML = rendered;
  }


  return {
    init,
    all,
    part,
    clear,
    sentenceHandler,
  };
})();

export default General;
