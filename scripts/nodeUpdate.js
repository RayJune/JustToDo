//更新节点的操作
function refreshNode(user_object) {
	//在网页上更新数据
	var dataParent = document.getElementById('myUl');
	//新建文本节点,记录时间和事件的节点，然后给文本节点赋值
	var textDate = document.createTextNode(user_object.user_date + ': ' );
	// var textEvent = document.createTextNode();
	var textEvent = document.createElement('span');
	var text = document.createTextNode(' ' + user_object.user_event);
	textEvent.appendChild(text);
	//搭好结构
	//总体
	var li = document.createElement('li');

	//根据完成的情况添加样式
	//完成的情况
	if (user_object.finished) {
		li.classList.add('checked');
	}
    
	//把文本节点附加上
	li.appendChild(textDate);
	li.appendChild(textEvent);
	//节点附加
	dataParent.insertBefore(li, dataParent.firstChild); //插入到最前面
    
	var i; //index
    
	//为每个li后面加上关闭按钮「x」
	(function closeBtn() {
		var myNodelist = document.getElementsByTagName('li');
		for(i = 0; i < myNodelist.length; i++) {
			var span = document.createElement('span');
			var txt = document.createTextNode('\u00D7'); //unicode编码下的x符号
			span.className = 'close';
			span.appendChild(txt);
			myNodelist[i].appendChild(span);
		}
	})();

	//点击关闭按钮，删除当前li
	(function closeElement() {
		var close = document.getElementsByClassName('close');
		for(i = 0; i < close.length; i++) {
			close[i].onclick = function() {
				var div = this.parentElement; //关闭按钮的父元素
				div.style.display = 'none';
			};
		}
	})();

	//添加点击事件
	li.addEventListener('click', function() {
		user_object.finished = !user_object.finished;
		//完成的情况
		if (user_object.finished) {
			li.classList.add('checked');
		}
		//未完成的情况
		else {
			li.classList.remove('checked');
		}

		//把数据同步到数据库
		var transaction = db.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user');
		user_object.finished = user_object.finished;
		console.log(user_object);
		//因为ID是自动增长的，所以使用put会给他增加数据，而不是修改数据
		storeHander.put(user_object).onsuccess = function(e) {
			console.log('修改数据成功');
		};

	}, false);
}


//清除TODO显示面板上所有的节点
function clearAllNodes() {
	var root = document.getElementById('myUl');
	while (root.hasChildNodes()) {
		root.removeChild(root.firstChild);
	}
}

