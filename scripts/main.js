//清除输入框中的数据
function clearInput() {
	var inputComment = document.getElementById('myInput');
	inputComment.value = '';
}

var addList = function() {
	var arrangement = setEvent();
	//如果数据为空，那么直接退出
	if (arrangement.user_event == '') {
		return false;
	}
	addData(arrangement);
	refreshNode(arrangement);
	clearInput();
};

//获取输入的数据,并对数据进行处理
var setEvent = function() {
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
};

//格式化日期,来源网络
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