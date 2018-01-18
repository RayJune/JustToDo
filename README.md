## 一个基于 indexedDB、plain JavaScript 实现的 toDoList web-app

### 就是去做

![就是去做](markdownImages/就是去做.jpg)

### 功能完成进度

- [x] 基本页面搭建 (Semantic HTML)，CSS布局（使用 flexbox，float，position 进行布局，样式参考前端观察）
- [x] 实现添加事项功能，并自动获得当前日期
- [x] 实现删除所有事项功能
- [x] 将数据保存在 indexedDB 中，并通过 indexedDB 来进行增删改查
- [x] 实现已完成、未完成、显示所有功能
- [x] 实现点击 li 最右边的 "x" 来删除当前条功能
- [x] 使用 event delegation
- [x] **重构**再重构
- [x] 使用 Eslint (airbnb-ES5) 以及其他好的 JavaScript pattern 来规范化代码，**提高代码可读性**
- [x] **将操作 indexedDB 数据库的函数封装出来成为一个 npm package，实现解耦**，package 托管在： https://www.npmjs.com/package/indexeddb-crud （这是自己发表的第一个 npm package，very delight :smile: ）
- [x] 使用 gulp 包来组建 npm 的 workflow
- [x] 抛弃 gulp，**构建 npm workflow 的本质就是 npm scripts**，用 npm scripts 重构 workflow (主要是使用 commonJS 以及 压缩 JS 和 CSS)
- [x] 提供 without indexedDB mode
- [x] 使用懒加载策略加载 without indexedDB mode
- [x] 使用 JavaScript templete engine 将 HTML 和 JavaScript 分离，提升渲染效率(using handlebars, prebuild scheme)
- [ ] 添加返回顶部的按钮
- [ ] 把 webpack 拿来当做普通的 shell 一样使用
- [ ] 用 ES6 来重构代码
- [ ] 实现完整的功能集 （比如给 todo 增加tags），参考 todoist.com
- [ ] 引入 jQuery，利用插件集成来实现效果，比如 Tag editor，in place editing
- [ ] 关注应用的 responsiveness，利用 css 框架做出更专业的效果
- [ ] 在侧边建立一个小日历，并可以通过日历来查询事件

### 页面设计理念

整体样式模仿于[前端观察](https://www.qianduan.net)

### 感谢

* [Garrik-Liu的todolist](https://github.com/Garrik-Liu/practises-web/tree/master/cases/12.toDoList)
* [Liugq5713的todolist](https://github.com/Liugq5713/Todolist)

参考/模仿了两位 first commit 的代码，向两位表示感谢：）
