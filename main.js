requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: './src',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        jquery:'jquery.min',
        bianliang:'base/bianliang',
        function:'base/function',
        common:'base/common',
        var:'base/var',
        h:'base/h',
        classnames:'/node_modules/classnames/index'
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

requirejs(['function','jquery'],function(func,jquery){
    console.log(jquery)
    // console.log($.extend)
    // console.log(bianliang)
    // console.log(func)
    // console.log(common)
    // console.log(classnames,2)
})