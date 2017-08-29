//获取到现在的ID值
function getId() {
    var transaction = db.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');

    var range = IDBKeyRange.lowerBound(0);
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

//添加数据
function addData(data) {
    var transaction = db.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');
    var addOpt = storeHander.add(data);
    addOpt.onerror = function() {
        console.log("failed");
    }
    addOpt.onsuccess = function() {
        console.log("add success");
    };
}






//TODO:删除数据
function delData() {
    var transaction = request.result.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');
    var range = IDBKeyRange.lowerBound(0, true);
    storeHander.openCursor(range, 'next').onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
            var requestDel = cursor.delete();
            requestDel.onsuccess = function() {
                console.log("del success");
                showData();
            }
            requestDel.onerror = function() {
                console.log("del fail");
            }
            cursor.continue();
        } else {}
    };

}

//展示数据
function showData() {
    clearAllNodes();
    var transaction = db.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');

    var range = IDBKeyRange.lowerBound(0, true);
    storeHander.openCursor(range, 'next').onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
            refreshNode(cursor.value);
            console.log(cursor.value + "show");
            cursor.continue();
        } else {
            console.log("done");
        }
    };
}
//显示已经完成的数据
function showDataDone() {
    clearAllNodes();
    var transaction = db.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');

    var range = IDBKeyRange.lowerBound(0, true);
    storeHander.openCursor(range, 'next').onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
            if (cursor.value.finished) {
                console.log(cursor.value + "done");
                refreshNode(cursor.value);
            }
            cursor.continue();
        } else {}
    };
}

//显示未完成的数据
function showDataTodo() {
    clearAllNodes();
    var transaction = db.transaction(["user"], "readwrite"),
        storeHander = transaction.objectStore('user');

    var range = IDBKeyRange.lowerBound(0, true);
    storeHander.openCursor(range, 'next').onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
            if (!cursor.value.finished) {
                console.log(cursor.value + "todo");
                refreshNode(cursor.value);
            }
            cursor.continue();
        } else {}
    };
}