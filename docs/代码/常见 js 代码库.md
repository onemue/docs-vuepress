# 常见 js 代码库

### 指定范围内的随机数

```js
/*
* @param {String|*}
* @returns {String}
* @example  randoms(10,2);    //8
*/
  function randoms(max,min){
    if(min===undefined) min=0;
    return Math.floor(Math.random()*(max-min)+min);
 }
```

### 时间格式化

```js
/**
 * 转换格式
 * @param {String} formatStr
 * @param {String|*} time 时间
 * @returns {String}
 * @example formatDate('YYYY-MM-DD hh:mm:ss', new Date())
 */
function formatDate(formatStr, time) {
  const date = time && new Date(time) || new Date()
  const o = {
    'M+': date.getMonth() + 1, // month
    'D+': date.getDate(), // day
    'h+': date.getHours(), // hour
    'm+': date.getMinutes(), // minute
    's+': date.getSeconds(), // second
    'q+': Math.floor((date.getMonth() + 3) / 3), // quarter
    'S': date.getMilliseconds() // millisecond
  }
  if (/(Y+)/.test(formatStr)) {
    formatStr = formatStr.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(formatStr)) {
      formatStr = formatStr.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return formatStr
}
```

### 时间轴(不考虑时间，只考虑几秒前，几分钟前，几小时前，几天前，几月前，几年前)

```js
/**
 * 转换格式
 * @param {String} str 时间
 * @returns {String}
 * @example formatTime(new Date()) // 4分钟前
 */
function formatAgo(str) {
  if (!str) return '';
  const date = new Date(Number(str));
  const time = new Date().getTime() - date.getTime(); // 现在的时间-传入的时间 = 相差的时间（单位 = 毫秒）
  if (time < 0) {
    return '';
  } else if (time / 1000 < 30) {
    return '刚刚';
  } else if (time / 1000 < 60) {
    return parseInt(String(time / 1000)) + '秒前';
  } else if (time / 60000 < 60) {
    return parseInt(String(time / 60000)) + '分钟前';
  } else if (time / 3600000 < 24) {
    return parseInt(String(time / 3600000)) + '小时前';
  } else if (time / 86400000 < 31) {
    return parseInt(String(time / 86400000)) + '天前';
  } else if (time / 2592000000 < 12) {
    return parseInt(String(time / 2592000000)) + '月前';
  } else {
    return parseInt(String(time / 31536000000)) + '年前';
  }
}
```

### 过滤对象中为空的值

```js
/**
 * 过滤对象中为空的值
 * description：因为在有的对象中本身没有赋值，但是往后台传值还是会把undefined传过去，该方法就是过滤掉对象中为空或者null或者undefined的值，本方法采用了递归，可以层层过滤
 * @param {object} data
 * @return {object}
 */
function filterObj(data) {
  const objClone = {}
  for (const i in data) {
    if (data[i] && typeof data[i] === 'object') {
      objClone[i] = filterObj(data[i])
    } else {
      if (!data[i] || data[i].length === 0) {
        delete data[i]
      } else {
        objClone[i] = data[i]
      }
    }
  }
  return objClone
}
```

### 数组去重

```js
/*
* @param [] arr
* @returns []
* @example  unique([1,1,1,2,3,4,4,5,7,7]); // [1,2,3,4,5,7]
*/
  function unique(arr) {
            if (!arr) {
                return '参数为数组必传'
            }
            for (var i = 0; i < arr.length; i++) {
                for (var j = i + 1; j < arr.length; j++) {
                    if (arr[i] == arr[j]) {
                        arr.splice(j, 1);
                        j--
                    }
                }
            }
            return arr
        }
```