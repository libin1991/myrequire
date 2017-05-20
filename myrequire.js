log = console.log
var requirejs, define;
(function(global){
    var op = Object.prototype;
    var entry,req,context,
    // define获取到模块保存在次变量中，script load事件里给该模块命名，并赋到globalQueue里
    temModule,
    Module={},
    globalQueue=[],
    head = document.getElementsByTagName('head')[0]

    // require模块
    context = {
        // config中配置的模块与路径对应表
        config:'',
        // 所有模块数组，依赖最深的数组在前面
        ModuleArr:[],
        // 所有模块的对象
        ModuleObj:{},
         // 记录一共加载了几个模块，每次script.load成功时减1，如果为0，执行require的callbakc
        totalLoad:0,
        // requirejs的回调函数
        callback:'',
        // requirejs的deps
        deps:[],
        // 加载模块的方法，加载requirejs的deps和difine的deps，callback是给requirejs执行时用的，define方法调用时不需要callback,模块的func在 script.load方法里添加到context.ModuleObj上
        require:function(deps, callback, errorback){
            if(callback) {
                context.callback = callback
                context.deps = deps
            }

            // 如果deps是数组，认为是调用requirejs或define的地方
            if(isArray(deps)) {
                deps.map(function(moduleName, index){
                    var config = this.config;
                    var temPath = this.handlePath(config.paths[moduleName]);

                    // 如果context.ModuleObj里存在模块，不加载
                    if(this.hasRecord(moduleName)) return

                    // 把要加载的模块放入所有模块对象中
                    context.ModuleObj[moduleName] = {
                        path:temPath
                    }
                    context.ModuleArr.unshift({
                        moduleName:moduleName,
                        path:temPath
                    })
                    this.totalLoad++


                    req.load(temPath,moduleName)
                    // 认为已经加载完所有依赖
                    // callback = callback
                    // setTimeout(function(){
                    //     // console.log(Module)
                    //     var tem = []
                    //     deps.map(function(item,index){
                    //         tem.push(Module[item].cb())
                    //     })
                    //     callback.apply(this,tem)
                    // },1000)

                }.bind(this))
            }
            // console.log(context.ModuleArr,123123)

            
        },
        onScriptLoad:function(e){
            var moduleName = e.path[0].dataset.requiremodule
            if(temModule) {
                // 把模块的func加到context.ModuleObj上
                temModule[0] = temModule[0] || moduleName
                Object.assign(context.ModuleObj[temModule[0]],{
                    deps:temModule[1],
                    cb:temModule[2]
                })
                // 完善ModuleArr对象
                context.addFuncToArr(temModule)
                // globalQueue.push(temModule)
                log(temModule,'加载完成')
                temModule = null

                // totalLoad为0时，说明模块都已加载，可以执行模块计算模块结果了,结果计算完毕后执行requirejs的callback
                context.totalLoad--
                if(context.totalLoad === 0) {
                    // console.log(context.ModuleObj)
                    context.loopDeps(context.ModuleObj);
                    var resultArr = context.getDepResult(context.deps)
                    context.callback.apply(null, resultArr)
                }
            } 

            
        },
        onScriptError:function(){
            console.log('load失败')
        },
        getDepResult:function(deps){
            var tem = deps.map(function(item, index){
                return context.ModuleObj[item].result
            })
            return tem
        },
        // 向ModuleArr中添加deps和cb对象
        addFuncToArr:function(module){
            for(var i in context.ModuleArr) {
                if(context.ModuleArr[i].moduleName === module[0]) {
                    context.ModuleArr[i].deps = module[1]
                    context.ModuleArr[i].cb = module[2]
                }
            }
        },
        hasLoad:function(moduleName){
            var flag = false
            var scripts = document.getElementsByTagName('script')
            Array.prototype.map.call(scripts,function(item, index){
                if(item.getAttribute('data-requiremodule') === moduleName) {
                    flag = true;
                }
            })
            return flag
            
        },
        // 把各模块的func执行，赋给result,因为moduleArr已经确保了依赖最深的再数组最前面，所以func的依赖一定能获取到
        loopDeps:function(deps){
            // for(var name in deps) {
            //     log(name)
            //     if(deps[name].deps.length !== 0) {

            //     }
            //     deps[name].result = deps[name].cb()
            // }
            var arr = context.ModuleArr,
                obj = context.ModuleObj
            arr.map(function(module, index){
                if(obj[module.moduleName].deps.length === 0) {
                    obj[module.moduleName].result = obj[module.moduleName].cb()
                }else{
                    var depsArr = obj[module.moduleName].deps.map(function(item, index){
                        return obj[item].result
                    })
                    obj[module.moduleName].result = obj[module.moduleName].cb.apply(null,depsArr)
                }
                
            })
            // console.log(this.ModuleObj)
        },
        // 查看当前模块是否记录到ModuleObj里了
        hasRecord:function(moduleName){
            return (this.ModuleObj[moduleName] !== undefined)
        },
        handlePath:function(temPath){
            // 如果路径首字符为/，则不拼接baseUrl
            return (temPath.charAt(0) === '/') ? temPath+'.js':this.config.baseUrl+'/'+temPath+'.js'
        }
    }

    req = requirejs = function(deps, callback, errorback){
        // 如果是字符串,默认是data-main入口文件
        if(typeof deps === 'string') {
            req.load(deps)
        }

        // 如果deps是数组，认为是调用requirejs的地方
        if(isArray(deps)) {
            context.require(deps, callback, errorback)
        }

        // deps为object，认为require.config被调用,设置config
        if (!isArray(deps) && typeof deps !== 'string') {
            context.config = deps
        }
        
    }

    requirejs.config = function(config){
        req(config)
    }

    req.load = function(path,moduleName){
        if(context.hasLoad(moduleName)) return
        var node = document.createElement('script');
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        node.setAttribute('data-requiremodule', moduleName);
        node.addEventListener('load', context.onScriptLoad, false);
        node.addEventListener('error', context.onScriptError, false);
        node.src = path
        head.appendChild(node)
    }

    // define模块,说明模块已经下载完并进入执行阶段，define执行完后会转到本模块的.load事件
    define = function(name, deps, func){
        if(isArray(name)) {
            func = deps;
            deps = name;
            name = null
        }
        if(isFunction(name)) {
            func = name
            deps = []
            name = null
        }

        // 一定是当前模块执行完后，会执行当前模块的node.load方法，这是连在一起的，别的js插不进来，利用这点使把当前模块的 function插到context的Module对象上
        temModule = [name,deps,func]
        log('开始加载',temModule)

        if(deps.length === 0) return

        // 加载define模块的依赖模块
        context.require(deps)
        // deps.map(function(moduleName, index){
        //     var temPath = context.handlePath(context.config.paths[moduleName]);
        //     context.
        //     req.load(temPath,moduleName)
        //     // log(context.hasLoad(moduleName))
        //     // if(context.hasLoad(moduleName)) {
        //     //     return
        //     // }else{
        //     //     log(2)
        //     //     var temPath = context.config.paths[moduleName];
        //     //     req.load(context.handlePath(temPath),moduleName)
        //     // }
        // })
    }
    define.amd = {
        jQuery: true
    };


    // Module构造函数
    function ModuleC(moduleName, path){
        this.moduleName = moduleName
        this.path = path
    }


    var scripts = document.getElementsByTagName('script')
    Array.prototype.map.call(scripts,function(item, index){
        if(item.getAttribute('data-main')) {
            req(item.getAttribute('data-main'))
        }
    })


    function isFunction(item){
        return op.toString.call(item) === '[object Function]'
    }

    function isArray(item){
        return op.toString.call(item) === '[object Array]'
    }
    global.context = context
})(window)


