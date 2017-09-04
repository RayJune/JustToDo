//添加数据总函数
function addList() {
	var arrangement = setEvent();
	//如果数据为空，那么直接退出
	if (arrangement.user_event == '') {
		return false;
	}
	addData(arrangement);
	refreshNode(arrangement);
	clearInput();
}
	
//添加数据
function addData(data) {
	var transaction = db.transaction(['user'], 'readwrite'),
		storeHander = transaction.objectStore('user'),
	 	addOpt = storeHander.add(data);
	addOpt.onerror = function() {
		console.log('failed');
	};
	addOpt.onsuccess = function() {
		console.log('add success');
	};
}

//显示已经完成的数据
function showDataDone() {
	clearAllNodes();
	var transaction = db.transaction(['user'], 'readwrite'),
		storeHander = transaction.objectStore('user');
	
	var range = IDBKeyRange.lowerBound(0, true);
	storeHander.openCursor(range, 'next').onsuccess = function(e) {
		var cursor = e.target.result;
		if (cursor) {
			if (cursor.value.finished) {
				console.log(cursor.value + 'done');
				refreshNode(cursor.value);
			}
			cursor.continue();
		}
	};
}

//显示未完成的数据
function showDataTodo() {
	clearAllNodes();
	var transaction = db.transaction(['user'], 'readwrite'),
		storeHander = transaction.objectStore('user');

	var range = IDBKeyRange.lowerBound(0, true);
	storeHander.openCursor(range, 'next').onsuccess = function(e) {
		var cursor = e.target.result;
		if (cursor) {
			if (!cursor.value.finished) {
				refreshNode(cursor.value);
			}
			cursor.continue();
		}
	};
}

//展示所有数据
function showData() {
	clearAllNodes();
	var transaction = db.transaction(['user'], 'readwrite'),
		storeHander = transaction.objectStore('user'),
		range = IDBKeyRange.lowerBound(0, true);
	storeHander.openCursor(range, 'next').onsuccess = function(e) {
		var cursor = e.target.result;
		if (cursor) {
			refreshNode(cursor.value);
			console.log(cursor.value + 'show');
			cursor.continue();
		} else {
			console.log('done');
		}
	};
}

