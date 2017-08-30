// 处理浏览器兼容性
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
window.IDBCursor = window.IDBCursor || window || window.webkitIDBCursor || window.msIDBCursor;


var cfg = {
    dbname: "justToDo",
    dbVersion: '1',
};
(function window_load() { // executes when complete page is fully loaded, including all frames, objects and images
    request = indexedDB.open(cfg.dbname, cfg.dbVersion); // 打开数据库

    request.onerror = function(event) {
        console.log("indexDB加载失败");
    };
    //异步成功后才能获取到
    request.onsuccess = function(event) {
        db = event.target.result;
        showData(); //将数据展示
        user_id = getId();
        document.getElementById('add').addEventListener('click', function() { addList() }, false);
        document.addEventListener('keydown', function(event) {
            if(event.keyCode == 13) {
                addList()
            }});
        document.getElementById('done').addEventListener('click', function() { showDataDone() }, false);
        document.getElementById('todo').addEventListener('click', function() { showDataTodo() }, false);
        document.getElementById('all').addEventListener('click', function() { showData() }, false);
        document.getElementById('delete').addEventListener('click', function() { delData() }, false);
    };

    request.onupgradeneeded = function(event) { //在我们请求打开的数据库的版本号和已经存在的数据库版本号不一致的时候调用。
        db = event.target.result;
        if (!db.objectStoreNames.contains("user")) {
            //在这里可以设置键值，也可以是auto
            var store = db.createObjectStore("user", { keyPath: 'id', autoIncrement: true }); //创建db
        }
        //在这里新建好一个数据库demo
        store.add({
            id: 0,
            user_event: 0,
            finished: true,
            date: 0
        });
    };
})();


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