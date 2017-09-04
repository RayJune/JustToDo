//更新节点的操作
function refreshNode(user_object) {
	//在网页上更新数据
	//新建文本节点,记录时间和事件的节点，然后给文本节点赋值
	var dataParent = document.getElementById('myUl'),
	    textDate = document.createTextNode(user_object.user_date + ': ' ),
	    textEvent = document.createElement('span'),
		text = document.createTextNode(' ' + user_object.user_event),
		li = document.createElement('li'),
		i; //index
	textEvent.appendChild(text);
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
        
        
	// 为每个li后面加上关闭按钮「x」
	// (function closeBtn() {
	// 	var myNodelist = document.getElementById('myUl'),
	// 		cloneList = myNodelist.cloneNode(),
	// 		liList = cloneList.childNodes,
	// 		len = cloneList.length;
	// 	for(i = 0; i < len; i++) {
	// 		var span = document.createElement('span'),
	// 			txt = document.createTextNode('\u00D7'); //unicode编码下的x符号
	// 		span.className = 'close';
	// 		span.appendChild(txt);
	// 		liList[i].appendChild(span);
	// 	}
	// 	document.getElementsByClassName('show')[0].replaceChild(cloneList, myNodelist);
	// })();
    
	//点击关闭按钮，删除当前li
	(function closeElement() {
		var close = document.getElementsByClassName('close'),
			len = close.length,
			div;
		for(i = 0; i < len; i++) {
			close[i].onclick = function() {
				div = this.parentElement; //关闭按钮的父元素
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

//格式化日期
Date.prototype.Format = function(fmt) {
	var o = {
		'y+': this.getFullYear(),
		'M+': this.getMonth() + 1, //月份
		'd+': this.getDate(), //日
		'h+': this.getHours(), //小时
		'm+': this.getMinutes() //分
	};
	for (var k in o) {
		if (new RegExp('(' + k + ')').test(fmt)) {
			if (k == 'y+') {
				fmt = fmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
			} else if (k == 'S+') {
				var lens = RegExp.$1.length;
				lens = lens == 1 ? 3 : lens;
				fmt = fmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
			} else {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
			}
		}
	}
	return fmt;
};
    
//加载前要清除TODO显示面板上所有的节点
function clearAllNodes() {
	var root = document.getElementById('myUl');
	while (root.hasChildNodes()) {
		root.removeChild(root.firstChild); //这种清除子节点速度非常快
	}
}
    
//清除输入框中的数据
function clearInput() {
	var inputComment = document.getElementById('myInput');
	inputComment.value = '';
}
        
//获取输入的数据,并对数据进行处理
function setEvent() {
	console.log(user_id);
        
	var item = document.getElementById('myInput').value;
	var createDate = new Date();
	var date = createDate.Format('yyyy年MM月dd日 hh:mm');
	user_id++;
	var arrangement = {
		id: user_id,
		user_event: item,
		finished: false,
		user_date: date
	};
	console.log(arrangement);
	return arrangement;
}