(function(){
    var i; //index

    //为每个li后面加上关闭按钮「x」
    function closeBtn() {
        var myNodelist = document.getElementsByTagName('li');
        for(i = 0; i < myNodelist.length; i++) {
            var span = document.createElement('span');
            var txt = document.createTextNode('\u00D7'); //unicode编码下的x符号
            span.className = 'close';
            span.appendChild(txt);
            myNodelist[i].appendChild(span);
        }
    }

    //点击关闭按钮，隐藏当前li
    function closeElement() {
        var close = document.getElementsByClassName('close');
        for(i = 0; i < close.length; i++) {
            close[i].onclick = function() {
                var div = this.parentElement; //关闭按钮的父元素
                div.style.display = 'none';
            }
        }
    }

    //清除TODO显示面板上所有的节点
    function clearAllNodes() {
        var root = document.getElementById('myUl');
        while (root.hasChildNodes()) {
            root.removeChild(root.firstChild);
        }
    }

    //点击li的时候，加上.checked，再点击则取消
    function ifChecked() {
        var list = document.querySelector('ul');
        list.onclick = function(ev) {
            if(ev.target.tagName === "LI") {
                ev.target.classList.toggle('checked');
            }
        }
    }

    Date.prototype.Format = function(fmt) {
        var o = {
            "y+": this.getFullYear(),
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
        };
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                if (k == "y+") {
                    fmt = fmt.replace(RegExp.$1, ("" + o[k]).substr(4 - RegExp.$1.length));
                } else if (k == "S+") {
                    var lens = RegExp.$1.length;
                    lens = lens == 1 ? 3 : lens;
                    fmt = fmt.replace(RegExp.$1, ("00" + o[k]).substr(("" + o[k]).length - 1, lens));
                } else {
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
        }
        return fmt;
    }

    //点击添加时，创建一个新的ul
    function newElement() {
        var li = document.createElement('li');
        var inputValue = document.getElementById('myInput').value;
        var createDate = new Date();
        var date = createDate.Format("yyyy/MM/dd:  ");
        inputValue = date  + " " + " " + inputValue;
        var t = document.createTextNode(inputValue);
        li.appendChild(t);
        if (inputValue === '') {
            alert('亲，请输入一个具体的任务');
        }
        else {
            document.getElementById('myUl').insertBefore(li, document.getElementById('myUl').firstChild);
        }
        document.getElementById('myInput').value = ''; //清空input输入框
    }

    //初始化list列表
    function initList() {
        closeBtn();
        closeElement();
        ifChecked();
    }

    //初始化
    function init() {
        var addButton = document.getElementById('add');
        var deleteButton = document.getElementById('delete');
        initList();

        //添加按钮点击时执行
        addButton.onclick = function() {
            newElement();
            initList();
        }
        deleteButton.onclick = function() {
            clearAllNodes();
        }
        //按回车时执行
        document.onkeydown = function(event) {
            if(event.keyCode == 13) {
                newElement();
                initList();
            }
        }
    }

    init();

})();