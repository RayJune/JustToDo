// 处理浏览器兼容性
(function(){
	if (!window.indexedDB) {
		window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
	}
	var cfg = {
			dbname: 'justToDo',
			dbVersion: '1',
		},
		request = indexedDB.open(cfg.dbname, cfg.dbVersion); // 打开数据库

	request.onerror = function() {
		console.log('indexDB加载失败');
	};
	//异步成功后才能获取到
	request.onsuccess = function(event) {
		db = event.target.result;
		showData(); //将数据展示
		user_id = getId();
		//添加事件处理函数
		document.getElementById('add').addEventListener('click', function() { addOneList(); }, false);
		document.addEventListener('keydown', function(event) {
			if(event.keyCode == 13) {
				addOneList();
			}});
		document.getElementById('done').addEventListener('click', function() { showDataDone(); }, false);
		document.getElementById('todo').addEventListener('click', function() { showDataTodo(); }, false);
		document.getElementById('all').addEventListener('click', function() { showData(); }, false);
		document.getElementById('delete').addEventListener('click', function() { deleteAllData(); }, false);
	};
    
	request.onupgradeneeded = function(event) { //在我们请求打开的数据库的版本号和已经存在的数据库版本号不一致的时候调用。
		db = event.target.result;
		if (!db.objectStoreNames.contains('user')) {
			//在这里可以设置键值，也可以是auto
			var store = db.createObjectStore('user', { keyPath: 'id', autoIncrement: true }); //创建db
		}
		//在这里新建好一个数据库demo
		store.add({
			id: 0,
			user_event: 0,
			finished: true,
			date: 0
		});
	};
    
	//获取到现在的ID值
	function getId() {
		var transaction = db.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user'),
			range = IDBKeyRange.lowerBound(0);
		storeHander.openCursor(range, 'next').onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				cursor.continue();
				user_id = cursor.value.id;
			} else {
				console.log(user_id);
			}
		};
	}
	
	//删除所有数据

	function resetNodes() { //重置ul为0
		var root = document.getElementById('myUl');
		while (root.hasChildNodes()) {
			root.removeChild(root.firstChild); //这是最快的清除所有子节点的方法
		}
	}

	function refreshOneNode(data) { //更新一个list节点，并返回一个fragment
		var fragment = document.createDocumentFragment(),	//使用fragment来包裹节点
			textDate = document.createTextNode(data.user_date + ': '),
			textWrap = document.createElement('span'),
			text = document.createTextNode(' ' + data.user_event),
			li = document.createElement('li');
		textWrap.appendChild(text);
		li.appendChild(textDate);
		li.appendChild(textWrap);

		// 根据完成的情况来确定是否添加完成样式
		if (data.finished) {
			li.classList.add('checked');
		}
		
		// 给每个li后面加上关闭按钮，并添加【x】删除事件
		var span = document.createElement('span'),
			x = document.createTextNode('\u00D7'); //unicode下的【x】
		span.className = 'close';
		span.appendChild(x);
		span.addEventListener('click', function() {
			this.parentElement.style.display = 'none';	//先隐藏起来
			
			//再更新数据库
			var transaction = db.transaction(['user'], 'readwrite'),
				storeHander = transaction.objectStore('user'),
				deleteOpt = storeHander.delete(data.id); //将当前选中li的数据从数据库中删除
			deleteOpt.onerror = function() {
				console.log('删除'+ data.id+ '到数据库失败');
			};
			deleteOpt.onsuccess = function() {
				console.log('删除'+ data.id +  '到数据库成功');
			};
		});
		li.appendChild(span);
		
		// 添加点击事件
		li.addEventListener('click', function() {
			data.finished = !data.finished; //切换
			if (data.finished) {
				li.classList.add('checked');
			}
			else {
				li.classList.remove('checked');
			}
		});
		fragment.appendChild(li); 
		return li;
	}

	function refreshNodes(dataArr) { //刷新节点
		var parent = document.getElementById('myUl'),
			fragment = document.createDocumentFragment(), //创建fragment
			i,
			len = dataArr.length;
		for (i = 0; i < len; i++) {
			fragment.insertBefore(refreshOneNode(dataArr[i]), fragment.firstChild); //每一个新加入的元素都排在最前面
		}
		// 将fragment添加到DOM中
		parent.appendChild(fragment); 
	}

	function showData() { //取出并展示所有list数据
		resetNodes(); //先重置ul
		var transaction = db.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user'),
			range = IDBKeyRange.lowerBound(0, true),
			cursor,
			dataArr = [];
		storeHander.openCursor(range, 'next').onsuccess = function(e) {
			cursor = e.target.result;
			if (cursor) {
				dataArr.push(cursor.value);
				cursor.continue();
			} 
			else {
				refreshNodes(dataArr); //将li数据整合为数组传入refreshNodes函数
				console.log('数据读取完毕');
			}
		};
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

	// 添加一条新list数据
	function addOneList() {
		//首先获取输入框中的数据
		var input = document.getElementById('myInput'),
			value = input.value,
			createDate = new Date(),
			date = createDate.Format('yyyy年MM月dd日 hh:mm');
		user_id++;
		if (value === '') {
			alert('请亲传入数据后重新提交~');
			return false;
		}
		var arrangement = {
			id: user_id,
			user_event: value,
			finished: false,
			user_date: date
		};
		console.log('您添加的数据为：' + arrangement); //打印一下写入的数据
		value = '';
		// 添加list数据到数据库中
		var transaction = db.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user'),
			addOpt = storeHander.add(arrangement);
		addOpt.onerror = function() {
			console.log('添加到数据库失败');
		};
		addOpt.onsuccess = function() {
			console.log('添加到数据库成功');
		};
		
		// 添加节点
		var newList = refreshOneNode(arrangement),
			parent = document.getElementById('myUl');
		parent.insertBefore(newList, parent.firstChild);

		// 重置输入框为0
		input.value = ''; 
	}

	// 显示所有 已/未 完成的list
	function showWhether(whether) {
		resetNodes(); //重置ul
		var transaction = db.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user'),
			range = IDBKeyRange.lowerBound(0, true),
			dataArr = [];
		storeHander.openCursor(range, 'next').onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				if (whether) {
					if (cursor.value.finished) {
						dataArr.push();
					}
				}
				else {
					if (!cursor.value.finished) {
						dataArr.push();
					}
				}
				cursor.continue();
			}
			refreshNodes(dataArr);  // 将符合条件的li数据整合为数组传入refreshNodes函数
		};
	}

	// 显示所有已完成的list
	function showDataDone() {
		showWhether(true);
	}

	// 显示所有未完成的list
	function showDataTodo() {
		showWhether(false);
	}

	// 删除所有list数据
	function deleteAllData() {
		var transaction = request.result.transaction(['user'], 'readwrite'),
			storeHander = transaction.objectStore('user'),
			range = IDBKeyRange.lowerBound(0, true);
		storeHander.openCursor(range, 'next').onsuccess = function(e) {
			var cursor = e.target.result,
				requestDel;
			if (cursor) {
				requestDel = cursor.delete();
				requestDel.onsuccess = function() {
					console.log('删除全部数据成功');
					showData();
				};
				requestDel.onerror = function() {
					console.log('删除全部数据失败');
				};
				cursor.continue();
			}
		};
	}
	
})();

