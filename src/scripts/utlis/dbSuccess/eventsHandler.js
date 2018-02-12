import DB from 'indexeddb-crud';
import Refresh from '../dbSuccess/refresh';
import General from '../dbGeneral/eventsHandlerGeneral';
import itemGenerator from '../templete/itemGenerator';

const eventsHandler = (() => {
  function add() {
    const inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    const newData = General.dataGenerator(DB.getNewKey(), inputValue);
    const rendered = itemGenerator(newData);

    removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    General.resetInput();
    DB.addItem(newData);
  }

  function removeInit() {
    const list = document.querySelector('#list');

    if (list.firstChild.className === 'aphorism') {
      list.removeChild(list.firstChild);
    }
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function clickLi(e) {
    const targetLi = e.target;
    // use event delegation

    if (!targetLi.classList.contains('aphorism')) {
      if (targetLi.getAttribute('data-id')) { // test whether is x
        targetLi.classList.toggle('finished'); // toggle appearance

        // use previously stored data-id attribute
        const id = parseInt(targetLi.getAttribute('data-id'), 10);

        DB.getItem(id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    const newData = data;

    newData.finished = !data.finished;
    DB.updateItem(newData, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') { // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      _addRandom();
      // use previously stored data
      const id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      DB.removeItem(id);
    }
  }

  // for Semantic
  function _addRandom() {
    const list = document.querySelector('#list');

    // because of the handlerbas.templete, add this inspect
    if (!list.lastChild || list.lastChild.nodeName === '#text') {
      Refresh.random();
    }
  }

  function showInit() {
    DB.getAll(Refresh.init);
  }

  function showAll() {
    DB.getAll(Refresh.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    const condition = 'finished';

    DB.getWhetherConditionItem(condition, whetherDone, Refresh.part);
  }

  function showClearDone() {
    const condition = 'finished';

    DB.removeWhetherConditionItem(condition, true, () => {
      DB.getAll(Refresh.part);
    });
  }

  function showClear() {
    Refresh.clear(); // clear nodes visually
    Refresh.random();
    DB.clear(); // clear data indeed
  }

  return {
    add,
    enterAdd,
    clickLi,
    removeLi,
    showInit,
    showAll,
    showDone,
    showTodo,
    showClearDone,
    showClear,
  };
})();

export default eventsHandler;
