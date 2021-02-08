const { src, dest, series, watch } = require('gulp');
const plugins = require('gulp-load-plugins')();  //批量引入package.json依赖插件
const revAll = require('gulp-rev-all'); //给静态资源添加hash值，并更新文件依赖
const del = require('del');  //删除文件
const gutil = require('gulp-util');
const ftp = require('vinyl-ftp');
const browserSync = require('browser-sync').create(); //多设备实时浏览器同步更新服务
const reload = browserSync.reload; //刷新

//清空目录
function del_dist() {
  return del(['dist']);
}

//判断min文件
const condition = function (f) {
  if (f.path.endsWith('.min.js') || f.path.endsWith('.min.css')) {  //排除已压缩的min文件
    return false;
  }
  return true;
}

//生产打包
function build() {
  const jsFilter = plugins.filter("**/*.js", { restore: true });  //js过滤
  const cssFilter = plugins.filter("**/*.css", { restore: true });  //css过滤

  return src(["src/**"])
    .pipe(plugins.preprocess({ context: { NODE_ENV: "production" } }))  //自定义环境变量，用于打包过程中条件判断处理
    .pipe(plugins.imagemin())  //图片压缩
    .pipe(jsFilter)
    .pipe(plugins.babel({ presets: ["@babel/env"], plugins: [] }))  //es6转es5
    .pipe(plugins.if(condition, plugins.uglify()))  //js压缩
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(plugins.if(condition, plugins.autoprefixer()))  //css自动添加前缀
    .pipe(plugins.if(condition, plugins.csso({ restructure: false })))  //压缩css，不重构
    .pipe(cssFilter.restore)
    .pipe(plugins.if(condition, revAll.revision({ dontRenameFile: [".html"], dontUpdateReference: [".html"] }))) //不给html本身加hash,不处理js里面的html引入
    .pipe(dest('dist'));
}

//上传ftp
const ftp_path = "/test";  //ftp上传目录，相对于账号根目录
function up_ftp() {
  var conn = ftp.create({
    host: '0.0.0.0',  //ftp地址
    port: '21',  //端口
    user: 'username',  //账号
    password: '123456'  //密码
  });
  return src(["./dist/**"])
    .pipe(conn.dest(ftp_path));
}

//本地开发静态服务器
// const { createProxyMiddleware } = require('http-proxy-middleware') //本地开发代理跨域请求插件
// const proxy = createProxyMiddleware(['/api'], {
//   target: 'https://xxx.yyy.com',  //后端接口域名
//   changeOrigin: true,
//   pathRewrite: {
//     '/api': '' //重写地址，配合接口地址定义
//   }
// }) //本地代理配置
function server() {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: "./src",
      // middleware: [proxy]  //配置代理
    }
  })
  watch("src/**/*.css", watch_css);  //动态监听css变化
  watch("src/**/*.js", watch_js);  //监听js变化,刷新页面
  watch("src/img/**", watch_img);  //监听img文件夹的img变化,刷新页面
  watch("src/*.html").on('change', reload);  //监听html更新则刷新页面
}

//生产打包后再次本地预览（弃用，直接上传生产环境测试）
function browser_sync_build() {
  browserSync.init({
    notify: false,
    port: 9001,
    server: {
      baseDir: "./dist",
      // middleware: [proxy]  //配置代理
    }
  })
}

//监听css变化
function watch_css() {
  return src(["src/**/*.css"])
    .pipe(plugins.filter("**/*.css"))
    .pipe(reload({ stream: true }));
}

//监听js变化
function watch_js() {
  return src(["src/**/*.js"])
    .pipe(reload({ stream: true }));
}

//监听img文件夹的img变化
function watch_img() {
  return src(["src/img/**"])
    .pipe(reload({ stream: true }));
}

exports.ftp = series(up_ftp);
exports.server = series(server);
exports.default = series(del_dist, build);
