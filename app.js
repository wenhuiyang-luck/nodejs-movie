var express = require('express');   // 加载express模块
var path = require('path');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var _ = require('underscore');
var Movie = require('./models/movie');
// var session=require('express-session');
// var cookieParser = require('cookie-parser');
// var mongoStore=require('connect-mongo')(session);
mongoose.Promise = global.Promise = require('bluebird');

var port = process.env.PORT || 3000;  // 设置端口,process是个全局变量，用来获取环境中的变量
var app = express();     // 启动一个web服务器
app.locals.moment = require('moment');

// 数据库连接
mongoose.connect('mongodb://127.0.0.1:27017/nodejs-mongodb', {useMongoClient: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongodb connect error !'));
db.once('open', function() {
    console.log('Mongodb started !');
});

// 设置视图的根目录
app.set('views', './views/pages');
app.set('view engine', 'pug');

// 设置默认的模板引擎
// app.use(express.bodyParser());   过版本语法，现已不支持,需单独安装body-parser模块
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());  //body-parser 解析json格式数据

// app.use(express.static(path.join(__dirname,'bower_components')));  过去版语法，现已不支持，需安装serveStatics
app.use(serveStatic('public'));
app.listen(port);  // 监听端口
console.log('app started on port ' + port);


// 1. index page 首页理由
app.get('/', function(req, res) {
	Movie.fetch(function(err, movies) {
		if(err) {
			console.log(err);
		}
		res.render('index', {
			title: '首页',
			movies: movies
		});
	});	
});

// 2. detail page 详情页路由
app.get('/movie/:id', function(req, res) {
	var id = req.params.id;
	Movie.findById(id, function(err, movie) {
		if(err) {
			console.log(err);
		}
		res.render('detail', {
			title: '详情页' + movie.title,
			movie: movie
		});
	});
});

// 3. admin page 后台录入页路由
app.get('/admin/movie', function(req, res) {
	res.render('admin', {
		title: '后台录入页',
		movie: {
			title: '',
			doctor: '',
			country: '',
			year: '',
			poster: '',
			summary: '',
			language: '',
			flash: ''
		}
	});
});

// 4. admin update movie 电影更新路由
app.get('/admin/update/:id', function(req, res) {
	var id = req.params.id;

	if(id) {
		Movie.findById(id, function(err, movie) {
			res.render('admin', {
				title: '后台更新页',
				movie: movie
			});
		});
	}
});

// 5. admin post movie 电影post路由
app.post('/admin/movie/new', function(req, res) {  // 后台录入页post过来的新数据
	var id = req.body.movie._id;   
	var movieObj = req.body.movie;
	var _movie;

	console.log("*******后台录入数据库*******" + id);

	if(id) {  // 判断
		Movie.findById(id, function(err, movie) {
			if(err) {
				console.log(err);
			}

			_movie = _.extend(movie, movieObj); //underscore模板的一个用法，复制movieObj的内容到movie，有重复会覆盖
			_movie.save(function(err, movie) {
				if(err) {
					console.log(err);
				}

				res.redirect('/movie/' + movie._id)
			});
		});
	}else {
		_movie = new Movie({
			doctor: movieObj.doctor,
			title: movieObj.title,
			country: movieObj.country,
			language: movieObj.language,
			year: movieObj.year,
			poster: movieObj.poster,
			flash: movieObj.flash,
			summary: movieObj.summary
		});

		_movie.save(function(err, movie) {
			if(err) {
				console.log(err);
			}
			// console.log("跳转之前电影的id是：" + movie._id);
			res.redirect('/movie/' + movie._id);
			// console.log("这里是跳转之后");
		});
	}
});


// 6. list page 电影列表页路由
app.get('/admin/list', function(req, res) {
	Movie.fetch(function(err, movies) {
		if(err) {
			console.log(err);
		}
		res.render('list', {
			title: '列表页',
			movies: movies
		});
	});
});

// 7. list delete movie
app.delete('/admin/list', function (req, res) {
    var id = req.query.id;
    if (id) {
        Movie.remove({_id: id}, function (err, movie) {
            if (err) {
                console.log(err);
            } else {
                res.json({success: 1});
            }
        });
    }
});
