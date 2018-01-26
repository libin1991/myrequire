## 前言

前几天看了下[webpack打包出来的js](https://juejin.im/post/5a5850b0f265da3e36413136)，豁然开朗觉得实现一个模块化工具稳稳的，真开始写的时候才发现too young。

## 基本目标

```
// 定义模块apple:
define('apple',['orange'],function(orange){
	return orange
})

// 定义模块orange:
define('orange',[],function(){
	return {
		name:'orange',
		color:'white',
		size:'small',
	}
})

// 使用定义好的模块:
var a = require(['apple','jquery'],function(apple,$){
    console.log(apple)
    console.log($('<div>123</div>'))
})

===>输出
{
    name:'orange',
    color:'white',
    size:'small',
},
n.fn.init [div]
```

## 实现流程

1. 首先定义模块名称与对应的路径，也就是实现require.config功能，简化版如下：

```
let paths = {
    apple:'./apple.js',
    orange:'./orange.js',
    jquery:'https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js',
}
```

2. 然后创建一个变量用于保存加载好的模块，创建一个变量收集所有执行require的地方。

```
// 存放所有注册require的模块，收集他们的依赖，以及回调
let reqs = {}

// 保存加载好的模块
let modules = {}
```

3. 创建require方法，使用与amd类似的方式，接收两个参数：1.依赖的模块数组，2.模块加载完后将要执行的回调。

```
function require(deps,callback) {
    ...
}
```

将本次执行require看做一个任务，并在reqs对象中注册下，模块加载完成后将执行本reqs中的所有任务。

```
// 任务名称从0开始，最早注册的任务为reqs[0]，随后++
let id = 0
// 创建执行模块
reqs[id] = {
    deps,
    id,
    callback,
}
id++
```

第一个require执行完后reqs对象将变为

```
{
    0:{
        callback:function(){..},
        id:0,
        deps:['apple','jquery']
    }
}
```

然后循环deps数组，创建script标签依次加载依赖的模块：

```
for(let item of deps) {
    // 如果modules变量中还没有保存本模块，首先在模块中初始化本模块：1.创建模块name，2.创建watcher属性用于记录是哪个注册reqs任务引用了我这个模块。然后创建script标签异步加载本模块。加载完成之后执行loadComplete方法。如果本模块在modoles里已存在，说明本模块已加载过，那么直接把reqs的任务id push到watchers里。
    if(!modules[name]) {
        // 初始化模块，并记住哪个reqs任务引用了本模块。
        modules[name] = {
            // 存放依赖此模块的模块名
            watchers:[id],
            name:name,
        }
        var node = document.createElement('script');
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        node.setAttribute('data-requiremodule', name);
        node.async = true;
        document.body.appendChild(node)
        node.addEventListener('load', loadComplete, false);
        node.src = paths[name]
    }else{
        modules[name].watchers.push(id)
    }
}
```

4. 按理说模块加载完成后就会执行loadComplete方法。

但需要注意的是，node.load方法会在下载好的js执行完之后才会执行。意思就是说如果加载的apple.js里有`console.log("apple模块加载好了")`，而loadComplete里有`console.log("执行script的onload方法")`，那么执行顺序是1.apple模块加载好了;2.执行script的onload方法。因为apple模块里执行了define方法，所以先看define的定义。

5. 创建define方法

本方法采用amd规范，接收三个变量：1.本模块名称，2.本模块的依赖模块，3.本模块的执行结果。
```
function define(name, deps, callback){
    ...
}
```

在modules变量中注册本模块，如果本模块有依赖，执行require方法先加载依赖，等依赖加载完只有执行callback获取模块的结果；如果本模块没有依赖，执行本模块的callback方法得到本模块的结果。
```
modules[name].callback = callback
if(deps.length === 0) {
    modules[name].result = callback()
}else{
    // 如果有依赖，要先执行依赖
    require(deps,function(){
        modules[name].result = callback(...arguments)
    })
}
```

以orange模块为例，define方法执行完之后modules变量为

```
{
    orange:{
        result:{
            name:'orange',
            color:'white',
            size:'small',
        }
    }
}
```

6. 定义模块是amd规范：`define.amd = true`

7. 下面真正到了loadComplete方法。也就是script的onload回调。

本方法主要的任务是：执行以前注册的那些依赖本模块的reqs任务。如果reqs任务的finish=true，说明模块已经执行过了，跳过。如果reqs任务没有执行过，那么拿到reqs任务deps属性，也就是依赖哪些模块，如果所有的模块都有result(结果)，执行本任务的callback，并将finish置为true.

```
function loadComplete(evt){
    var node = evt.currentTarget || evt.srcElement;
    node.removeEventListener('load', loadComplete);

    let name = node.getAttribute('data-requiremodule')
    modules[name].watchers.map((item)=>{
        if(reqs[item].finish) return
        let completed = true
        let args = []
        reqs[item].deps.map(item2=>{
            if(!modules[item2].result) {
                completed = false
            }else{
                args.push(modules[item2].result)
            }
        })
        if(completed) {
            reqs[item].callback(...args)
            reqs[item].finish = true
            reqs[item].completed = true
        }
    })
}
```

[代码](https://github.com/mcdyzg/myrequire)

参考：

> [浏览器加载 CommonJS 模块的原理与实现](http://www.ruanyifeng.com/blog/2015/05/commonjs-in-browser.html)


## 更大的目标

仿照require1k实现类似requirejs的模块加载库。[代码](https://github.com/mcdyzg/myrequire)

果然复杂的多，根据注释走了一遍流程，基本上流程走的通。

参考：

> [requirejs 源码与架构分析](http://www.ruanyifeng.com/blog/2015/05/require.html)

> [requirejs源码学习笔记（一）](http://blog.csdn.net/xmloveth/article/details/55144890)

> [require1k](https://github.com/Stuk/require1k)
