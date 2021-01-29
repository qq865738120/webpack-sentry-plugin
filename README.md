# Webpack del file plugin

将构建后的文件进行删除操作，虽然这看起来很没用，但是在使用例如sentry，需要将生成的sourceMap先上传然后删除这种操作时，它会很有用。

### 安装

Using npm:

```
$ npm install webpack-del-file-plugin --save-dev
```

### 使用

1. Require `webpack-sentry-plugin`:

```js
var DelFilePlugin = require('webpack-del-file-plugin');
```

2. 使用插件并配置:

```js
var config = {
 plugins: [
   new DelFilePlugin({
     // 需要删除的文件名正则，默认会匹配.map文件
     deleteRegex: /\.map$/
   })
 ]
}
```
