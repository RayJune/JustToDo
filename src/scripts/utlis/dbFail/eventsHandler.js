import Refresh from '../dbFail/refresh';
import General from '../dbGeneral/eventsHandlerGeneral';
import itemGenerator from '../templete/itemGenerator';

const eventsHandler = (() => {
  let _id = 0; // so the first item's id is 1

  function add() {
    const inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      addHandler(inputValue);
    }
  }

  function addHandler(inputValue) {
    const list = document.querySelector('#list');

    _removeRandom(list);
    _id += 1;
    const newData = General.dataGenerator(_id, inputValue);
    list.insertBefore(itemGenerator(newData), list.firstChild); // push newLi to first
    General.resetInput();
  }

  function _removeRandom(list) {
    const listItems = list.childNodes;

    [...listItems].forEach((item) => {
      if (item.classList.contains('aphorism')) {
        list.removeChild(item);
      }
    });
  }
  // or use for...in
  // for (const index in listItems) {
  //   if (listItems.hasOwnProperty(index)) {
  //     if (listItems[index].classList.contains('aphorism')) {
  //       list.removeChild(listItems[index]);
  //     }
  //   }
  // }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function showAll() {
    const list = document.querySelector('#list');
    const listItems = list.childNodes;

    [...listItems].forEach((item) => {
      _whetherAppear(item, true);
      if (item.classList.contains('finished')) {
        list.removeChild(item);
        list.appendChild(item); // PUNCHLINE: drop done item
      }
    });
  }

  /* eslint-disable no-param-reassign  */
  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none'; // FIXME: eslint error
  }
  /* eslint-enable no-param-reassign  */

  function clickLi({ target }) {
    // use event delegation
    if (target.getAttribute('data-id')) {
      target.classList.toggle('finished');
      showAll();
    }
  }

  // li's [x]'s delete
  function removeLi({ target }) {
    if (target.className === 'close') { // use event delegation
      _removeLiHandler(target);
      _addRandom();
    }
  }

  function _removeLiHandler(element) {
    // use previously stored data
    const list = document.querySelector('#list');
    const listItems = list.childNodes;
    const id = element.parentNode.getAttribute('data-id');

    try {
      [...listItems].forEach((item) => {
        if (item.getAttribute('data-id') === id) {
          list.removeChild(item);
        }
      });
    } catch (error) {
      console.log('Wrong id, not found in DOM tree');
      throw new Error(error);
    }
  }

  function _addRandom() {
    const list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      Refresh.random();
    }
  }

  function _allDisappear(list) {
    const listItems = list.childNodes;

    return Array.prototype.every.call(listItems, item => item.style.display === 'none');
  }

  function showInit() {
    Refresh.init();
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    const list = document.querySelector('#list');
    const listItems = list.childNodes;

    _removeRandom(list);
    [...listItems].forEach((item) => { // FIXME: eslint error
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    _addRandom();
  }

  function showClearDone() {
    const list = document.querySelector('#list');
    const listItems = list.childNodes;

    _removeRandom(list);
    [...listItems].forEach((item) => {
      if (item.classList.contains('finished')) {
        list.removeChild(item);
      }
    });
    _addRandom();
  }

  function showClear() {
    Refresh.clear(); // clear nodes visually
    Refresh.random();
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
