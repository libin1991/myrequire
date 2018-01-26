console.log('main.js已加载完成,开始执行')
console.log('%cconfig开始执行','color:red;')
requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: './src',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        // jquery:'jquery.min',
        jquery:'https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js',
        bianliang:'base/bianliang',
        function:'base/function',
        common:'base/common',
        var:'base/var',
        h:'base/h',
        classnames:'/node_modules/classnames/index',
    }
});
// requirejs(['jquery','bianliang','function','common','classnames'],function($,bianliang,func,common,classnames){
//     console.log('main')
//     // console.log($.extend)
//     // console.log(bianliang)
//     // console.log(func)
//     // console.log(common)
//     // console.log(classnames,2)
// })

console.log('%c开始require用户需要的js','color:green;')
requirejs(['var','common'],function(varr,common){
    // console.log(jquery)
    // console.log($.extend)
    // console.log(bianliang)
    console.log(varr)
    // console.log(func)
    console.log(common)
    // console.log(classnames,2)
})

// requirejs(['jquery'],function(jquery){
//     console.log(jquery,123)
// })
