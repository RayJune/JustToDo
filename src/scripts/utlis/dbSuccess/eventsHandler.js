import DB from 'indexeddb-crud';
import Refresh from '../dbSuccess/refresh';
import General from '../dbGeneral/eventsHandlerGeneral';
import itemGenerator from '../templete/itemGenerator';

const eventsHandler = (() => {
  const storeName = 'list';

  function add() {
    const inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    const newData = General.dataGenerator(DB.getNewKey(storeName), inputValue);
    const rendered = itemGenerator(newData);

    removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    General.resetInput();
    DB.addItem(storeName, newData);
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
        const id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        DB.getItem(storeName, id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    const newData = data;

    newData.finished = !data.finished;
    DB.updateItem(storeName, newData, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') { // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      addRandom();
      // use previously stored data
      const id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      DB.removeItem(storeName, id);
    }
  }

  // for Semantic
  function addRandom() {
    const list = document.querySelector('#list');

    if (!list.hasChildNodes()) {
      Refresh.random();
    }
  }

  function showInit() {
    DB.getAll(storeName, Refresh.init);
  }

  function showAll() {
    DB.getAll(storeName, Refresh.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    const condition = 'finished';

    DB.getWhetherConditionItem(storeName, condition, whetherDone, Refresh.part);
  }

  function showClearDone() {
    const condition = 'finished';

    DB.removeWhetherConditionItem(storeName, condition, true, () => {
      DB.getAll(storeName, Refresh.part);
    });
  }

  function showClear() {
    Refresh.clear(); // clear nodes visually
    Refresh.random();
    DB.clear(storeName); // clear data indeed
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
