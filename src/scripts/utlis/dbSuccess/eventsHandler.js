import DB from 'indexeddb-crud';
import Refresh from '../dbSuccess/refresh';
import General from '../dbGeneral/eventsHandlerGeneral';
import itemGenerator from '../templete/itemGenerator';

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

function enterAdd({ keyCode }) {
  if (keyCode === 13) {
    add();
  }
}

function clickLi({ target }) {
  // use event delegation
  if (!target.classList.contains('aphorism')) {
    if (target.getAttribute('data-id')) { // test whether is x
      target.classList.toggle('finished'); // toggle appearance

      // use previously stored data-id attribute
      const id = parseInt(target.getAttribute('data-id'), 10);

      DB.getItem(id)
        .then(_toggleLi);
    }
  }
}

function _toggleLi(data) {
  const newData = data;

  newData.finished = !data.finished;
  DB.updateItem(newData)
    .then(showAll);
}

// li's [x]'s delete
function removeLi({ target }) {
  if (target.className === 'close') { // use event delegation
    // delete visually
    document.querySelector('#list').removeChild(target.parentNode);
    _addRandom();
    // use previously stored data
    const id = parseInt(target.parentNode.getAttribute('data-id'), 10);
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
  DB.getAll()
    .then(Refresh.init);
}

function showAll() {
  DB.getAll()
    .then(Refresh.all);
}

function showDone() {
  _showWhetherDone(true);
}

function showTodo() {
  _showWhetherDone(false);
}

function _showWhetherDone(whetherDone) {
  const condition = 'finished';

  DB.getConditionItem(condition, whetherDone)
    .then(Refresh.part);
}

function showClearDone() {
  const condition = 'finished';

  DB.removeConditionItem(condition, true)
    .then(DB.getAll)
    .then(Refresh.part);
}

function showClear() {
  Refresh.clear(); // clear nodes visually
  DB.clear()
    .then(Refresh.random); // clear data indeed
}


export default {
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
