// 暂时不用这个文件
(function(){
	var i; //index

	//为每个li后面加上关闭按钮「x」
	function closeBtn() {
		var myNodelist = document.getElementsByTagName('li'),
			span,
			txt,
			len = myNodelist.length;
		for(i = 0; i < len; i++) {
			span = document.createElement('span');
			txt = document.createTextNode('\u00D7'); //unicode编码下的x符号
			span.className = 'close';
			span.appendChild(txt);
			myNodelist[i].appendChild(span);
		}
	}

	//点击关闭按钮，隐藏当前li
	function closeElement() {
		var close = document.getElementsByClassName('close'),
			div,
			len = close.length;
		for(i = 0; i < len; i++) {
			close[i].onclick = function() {
				div = this.parentElement; //关闭按钮的父元素
				div.style.display = 'none';
			};
		}
	}

	//点击li的时候，加上.checked，再点击则取消
	function ifChecked() {
		var list = document.getElementsByTagName('ul')[0];
		list.onclick = function(event) {
			if(event.target.tagName === 'LI') {
				event.target.classList.toggle('checked');
			}
		};
	}

	Date.prototype.Format = function(fmt) {
		var o = {
				'y+': this.getFullYear(),
				'M+': this.getMonth() + 1, //月份
				'd+': this.getDate(), //日
			},
			k,
			lens;
		for ( k in o) {
			if (new RegExp('(' + k + ')').test(fmt)) {
				if (k == 'y+') {
					fmt = fmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
				} else if (k == 'S+') {
					lens = RegExp.$1.length;
					lens = lens == 1 ? 3 : lens;
					fmt = fmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
				} else {
					fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
				}
			}
		}
		return fmt;
	};

	//点击添加时，创建一个新的ul
	function newElement() {
		var li = document.createElement('li'),
			inputValue = document.getElementById('myInput').value,
			createDate = new Date(),
			date = createDate.Format('yyyy/MM/dd:  '),
			txt;
		inputValue = date  + ' ' + ' ' + inputValue;
		txt = document.createTextNode(inputValue);
		li.appendChild(txt);
		if (inputValue === '') {
			alert('亲，请输入一个具体的任务');
		}
		else {
			document.getElementById('myUl').insertBefore(li, document.getElementById('myUl').firstChild);
		}
		document.getElementById('myInput').value = ''; //清空input输入框
	}

	//清除TODO显示面板上所有的节点
	function clearAllNodes() {
		var root = document.getElementById('myUl');
		while (root.hasChildNodes()) {
			root.removeChild(root.firstChild);
		}
	}

	//初始化list列表
	function initList() {
		closeBtn();
		closeElement();
		ifChecked();
	}

	//初始化
	function init() {
		var addButton = document.getElementById('add'),
			deleteButton = document.getElementById('delete');
		initList();

		//添加按钮点击时执行
		addButton.onclick = function() {
			newElement();
			initList();
		};
		deleteButton.onclick = function() {
			clearAllNodes();
		};
		//按回车时同样执行添加
		document.onkeydown = function(event) {
			if(event.keyCode == 13) {
				newElement();
				initList();
			}
		};
	}

	init();

})();