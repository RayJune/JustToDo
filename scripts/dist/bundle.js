!function e(t,n,o){function r(a,i){if(!n[a]){if(!t[a]){var c="function"==typeof require&&require;if(!i&&c)return c(a,!0);if(u)return u(a,!0);var s=new Error("Cannot find module '"+a+"'");throw s.code="MODULE_NOT_FOUND",s}var l=n[a]={exports:{}};t[a][0].call(l.exports,function(e){var n=t[a][1][e];return r(n||e)},l,l.exports,e,t,n,o)}return n[a].exports}for(var u="function"==typeof require&&require,a=0;a<o.length;a++)r(o[a]);return r}({1:[function(e,t,n){"use strict";!function(){function t(){for(var e=document.querySelector("#myUl");e.hasChildNodes();)e.removeChild(e.firstChild)}function n(){t(),h.retrieveAllData(o)}function o(e){var t,n=document.createDocumentFragment(),o=e.length;for(t=0;t<o;t++)n.insertBefore(r(e[t]),n.firstChild);document.querySelector("#myUl").appendChild(n),console.log("刷新，并展示DOM完毕")}function r(e){var t,n,o=document.createTextNode(e.userDate+": "),r=document.createElement("span"),u=document.createTextNode(" "+e.userEvent),a=document.createElement("li");return r.appendChild(u),a.appendChild(o),a.appendChild(r),e.finished&&a.classList.add("checked"),t=document.createElement("span"),n=document.createTextNode("×"),t.className="close",t.appendChild(n),t.setAttribute("data-x",e.id),a.appendChild(t),a.getAttribute("data-index")||a.setAttribute("data-index",e.id),a}function u(){var e,t,n=document.querySelector("#myInput"),o=n.value,u=a("yyyy年MM月dd日 hh:mm"),i=document.querySelector("#myUl");return h.userId++,""===o?(alert("请亲传入数据后重新提交~"),!1):(e={id:h.userId,userEvent:o,finished:!1,userDate:u},(t=r(e)).setAttribute("data-index",e.id),i.insertBefore(t,i.firstChild),n.value="",h.createOneData(e),0)}function a(e){var t=new Date,n=e,o={"y+":t.getFullYear(),"M+":t.getMonth()+1,"d+":t.getDate(),"h+":t.getHours(),"m+":t.getMinutes()};for(var r in o)if(new RegExp("("+r+")").test(n))if("y+"===r)n=n.replace(RegExp.$1,(""+o[r]).substr(4-RegExp.$1.length));else if("S+"===r){var u=RegExp.$1.length;u=1===u?3:u,n=n.replace(RegExp.$1,("00"+o[r]).substr((""+o[r]).length-1,u))}else n=n.replace(RegExp.$1,1===RegExp.$1.length?o[r]:("00"+o[r]).substr((""+o[r]).length));return n}function i(e){13===e.keyCode&&u()}function c(e){var t=e.target;if(t.getAttribute("data-index")){var n=parseInt(t.getAttribute("data-index"),10);console.log(n),console.log(typeof n),h.retrieveOneData(n,s,[t])}}function s(e,t){console.log(e),t.finished=!e.finished,t.finished?t.classList.add("checked"):t.classList.remove("checked"),e.finished=t.finished,h.updateDate(e)}function l(e){"close"===e.target.className&&d(parseInt(e.target.getAttribute("data-x"),10))}function d(e){h.deleteOneData(e),n()}function f(e){t(),h.retrieveDataWhetherDone(e,"finished",o),console.log("显示数据完毕")}function p(){f(!0)}function v(){f(!1)}function g(){t(),h.deleteAllData()}var h=e("./myIndexedDB"),m={name:"justToDo",version:"1"};m.dataDemo={id:0,userEvent:0,finished:!0,date:0},h.init(m,function(){n();var e=document.querySelector("#myUl");e.addEventListener("click",c,!1),e.addEventListener("click",l,!1),document.getElementById("add").addEventListener("click",u,!1),document.addEventListener("keydown",i,!0),document.getElementById("done").addEventListener("click",p,!1),document.getElementById("todo").addEventListener("click",v,!1),document.getElementById("all").addEventListener("click",n,!1),document.getElementById("delete").addEventListener("click",g,!1)})}()},{"./myIndexedDB":2}],2:[function(e,t,n){"use strict";var o=function(){function e(e,t){var n=indexedDB.open(e.name,e.version);n.onerror=function(){console.log("indexDB加载失败")},n.onsuccess=function(e){o.db=e.target.result,o.userId=r(),t&&t()},n.onupgradeneeded=function(t){if(o.db=t.target.result,!o.db.objectStoreNames.contains("user"))var n=o.db.createObjectStore("user",{keyPath:"id",autoIncrement:!0});n.add(e.dataDemo)}}function t(e){return(e?o.db.transaction(["user"],"readwrite"):o.db.transaction(["user"])).objectStore("user")}function n(){return IDBKeyRange.lowerBound(0,!0)}function r(){var e=t(!0),r=n();e.openCursor(r,"next").onsuccess=function(e){var t=e.target.result;t?(t.continue(),o.userId=t.value.id):console.log("现在的id为:"+o.userId)}}return{init:function(t,n){return window.indexedDB?(n&&e(t,n),0):(window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."),0)},createOneData:function(e,n,o){var r=t(!0).add(e);r.onerror=function(){console.log("添加到数据库失败")},r.onsuccess=function(){console.log("添加到数据库成功"),n&&(o?n.apply(null,o):n())}},retrieveOneData:function(e,n,o){var r=t(!1).get(e);r.onerror=function(){console.log("查找数据失败")},r.onsuccess=function(){console.log("查找数据成功"),o?(o.unshift(r.result),n.apply(null,o)):n(r.result)}},retrieveDataWhetherDone:function(e,o,r,u){var a=[],i=t(!0),c=n();i.openCursor(c,"next").onsuccess=function(t){var n=t.target.result;n?(e?n.value[o]&&a.push(n.value):e||n.value[o]||a.push(n.value),n.continue()):r&&(u?(u.unshift(a),r.apply(null,u)):r(a))}},retrieveAllData:function(e,o){var r=t(!0),u=n(),a=[];r.openCursor(u,"next").onsuccess=function(t){var n=t.target.result;n?(a.push(n.value),n.continue()):e&&(o?(o.unshift(a),e.apply(null,o)):e(a))}},updateDate:function(e,n,o){var r=t(!0);console.log(e);var u=r.put(e);u.onerror=function(){console.log("修改数据失败")},u.onsuccess=function(){console.log("修改数据成功"),n&&(o?n.apply(null,o):n())}},deleteOneData:function(e,n,o){var r=t(!0).delete(e);r.onerror=function(){console.log("删除"+e+"到数据库失败")},r.onsuccess=function(){console.log("删除"+e+"到数据库成功"),n&&(o?n.apply(o):n())}},deleteAllData:function(e,o){var r=t(!0),u=n();r.openCursor(u,"next").onsuccess=function(t){var n,r=t.target.result;r?((n=r.delete()).onsuccess=function(){console.log("删除数据成功")},n.onerror=function(){console.log("删除全部数据失败")},r.continue()):e&&(o?e.apply(null,this):e())}}}}();t.exports=o},{}]},{},[1]);
//# sourceMappingURL=bundle.js.map
