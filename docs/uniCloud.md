# 出现两年的 uniCloud 

### 写在前面

近些年来，随着云计算的流行，就有人提出了`Serverless`想法。

什么是`Serverless` ?

`Serverless` 就是不考虑服务器资源的编程，`Serverless + js ` 编程就是简化后端处理，能在前端处理就在前端处理，不需要调用后端借口直接调用数据库和云存储等等内容。

`uniCloud` 是 DCloud 联合阿里云、腾讯云，为开发者提供的基于 serverless 模式和 js 编程的[云开发](https://cloud.tencent.com/product/tcb?from=10680)平台。

在`uniCloud`平台集成了，云数据库、云函数、云存储等等内容资源，我们可以通过 js 直接连接云数据库，也可在服务器部署云函数，也可以通过 js 上传文件到云存储空间。

### 云数据库

`uniCloud`平台提供多种方式操作数据库，包括在云函数内使用传统方式操作数据库、在前端或者在云函数使用`JQL`语法直接操作数据库、在前端使用`<unicloud-db>`查询数据库。

当然我个人在使用中比较喜欢使用在前端使用`JQL`操作数据库，但是我发现在前端操作数据库的时候，一些连表查询比较，因为`uniCloud`平台对一些操作进行了简化、优化处理。

### 云函数

云函数是运行在云端的 `JavaScript` 代码，是基于 `Node.js` 的扩展。

`uniCloud`就是在`Node.js`的基础上增加了`uniCloud`对象，`uniCloud`对象内置了一下操作数据库、网络云存储的一些内容。

云函数可以定时执行，可以把一些定时任务等内容写到云函数内。

### 云存储

使用`uniCloud`云存储，无需再像传统模式那样单独去购买存储空间、CDN映射、流量采购等。

### 缺点

1. 官方文档比较混乱，案例比较少，不利于快速上手
2. 多表关联查询场景下不理想，特别是要开发一些统计页面的时候
3. 没有泪水navicat的可视化展示内容
4. 没有类似[MySQL](https://cloud.tencent.com/product/cdb?from=10680)的分析器，不太容易发现你的查询语句哪里出错


