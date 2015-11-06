var express       = require('express');
var app           = express();
var session       = require('express-session');
var MongoDBStore  = require('connect-mongodb-session')(session);
var crypto        = require('crypto');
var fs            = require('fs');
var nconf         = require('nconf');
var multipart     = require('connect-multiparty');
var bodyParser    = require('body-parser');
var url           = require("url");
var path          = require("path");
var mime          = require('mime');
var gm            = require('gm');
//require("console-stamp")(console, { 'pattern': '' });

var config_path = 'molduras-config.json';
var multipartMiddleware = multipart();

nconf.argv().env().file({ file: config_path });

nconf.defaults({
    'sessionKey': 'someSessionKey',
    'molduras': [
      { 
        'id' : 0,
        'fundo' : '/static/img/moldura-1.png', 
        'minifundo' : '/static/img/thumb-1.jpg', 
        'espacos': 2, 
        'posicoes': [ 
          { id: 0, 'x': 212, 'y': 100, 'w': 100, 'h': 70  },
          { id: 1, 'x': 404, 'y': 100, 'w': 100, 'h': 70  }
        ]
      },
      { 
        'id' : 1,
        'fundo' : '/static/img/moldura-2.png',  
        'minifundo' : '/static/img/thumb-2.jpg', 
        'espacos': 3, 
        'posicoes': [ 
          { id: 0, 'x': 121, 'y': 108, 'w': 100, 'h': 70  },
          { id: 1, 'x': 337, 'y': 108, 'w': 100, 'h': 70  },
          { id: 2, 'x': 521, 'y': 108, 'w': 100, 'h': 70  }
        ]
      },
      { 
        'id' : 2,
        'fundo' : '/static/img/moldura-3.png',  
        'minifundo' : '/static/img/thumb-3.jpg', 
        'espacos': 4, 
        'posicoes': [ 
          { id: 0, 'x': 49, 'y': 102, 'w': 100, 'h': 70  },
          { id: 1, 'x': 213, 'y': 102, 'w': 100, 'h': 70  },
          { id: 2, 'x': 398, 'y': 102, 'w': 100, 'h': 70  },
          { id: 3, 'x': 549, 'y': 102, 'w': 100, 'h': 70  }
        ]
      },
      { 
        'id' : 3,
        'fundo' : '/static/img/moldura-4.png',  
        'minifundo' : '/static/img/thumb-4.jpg', 
        'espacos': 5, 
        'posicoes': [ 
          { id: 0, 'x': 39, 'y': 120, 'w': 88, 'h': 63  },
          { id: 1, 'x': 178, 'y': 120, 'w': 88, 'h': 63  },
          { id: 2, 'x': 333, 'y': 120, 'w': 88, 'h': 63  },
          { id: 3, 'x': 474, 'y': 120, 'w': 88, 'h': 63  },
          { id: 4, 'x': 607, 'y': 120, 'w': 88, 'h': 63  }
        ]
      }
    ]
});

var store = new MongoDBStore(
{ 
  uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
  collection: 'mySessions'
});
 
    // Catch errors 
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});
 
app.use(require('express-session')({
  secret: nconf.get('sessionKey'),
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 1000 * 120/*60 * 60*/ },
  store: store
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  if (!req.session.username) {
    req.session.username = crypto.randomBytes(64).toString('hex');
    req.session.photos = [];
    console.log('[new session-ID=' + req.sessionID + ' ]' + req.session.photos.length);
  }
  
  //console.log('session-ID=' + req.sessionID + ' Session:' + JSON.stringify(req.session.photos) + ']');
  next();
});

function resetSession(req) {
  req.session.destroy();
  console.log('[session cleaned]');
}

app.set('views', './views');
app.set('view engine', 'jade');

app.get('/', function (req, res, next) {
  nconf.load();
  var molduras = nconf.get('molduras');
  res.render('index', { title: 'FNORD', areas: 3, molduras: molduras });
});

app.get('/files.json', function (req, res, next) {
  console.log('[files.json] ' + JSON.stringify(req.session.photos));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ uploads: req.session.photos }));
});

app.get('/resetSession', function (req, res, next) {
  resetSession(req);
  res.send('ok');
});

app.get('/download', function (req, res, next) {
  try {
    var molduras = nconf.get('molduras');
    console.log('[molduras=' + JSON.stringify(req.session) + ']');
    var moldura = molduras[req.session.molduraID];
    var molduraPath = moldura.fundo;
    var newImgPath = '/static/done/' + req.sessionID + '.png';
    var fullNewImgPath = __dirname + newImgPath;
    var image = gm(__dirname + molduraPath);
    for (var i = 0, len = req.session.photos.length; i < len; i++) {
      var photo = req.session.photos[i];
      var filename = __dirname + (photo.file || photo);
      var x = photo.posicao.x;
      var y = photo.posicao.y;
      var w = photo.posicao.w;
      var h = photo.posicao.h;
      var drawCommand = 'image  Over ' + x + ',' + y + ' ' + w + ',' + h + ' ' + filename;
      console.log('[drawCommand]' + drawCommand);
      image.draw(drawCommand);
    }
    image.write(fullNewImgPath, function (err) {
      if (err) 
        console.log('error: gm image saving: ' + err);
      else {
        var filename = path.basename(fullNewImgPath);
        var mimetype = mime.lookup(fullNewImgPath);
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(fullNewImgPath);
        console.log('[file downloaded] ' + fullNewImgPath);
        filestream.pipe(res);
      }
    });
  } catch (e) {
    if (e) 
        console.log('error: gm: ' + e);
  }
});

app.get('/upload', function (req, res, next) {
  //console.log('[photos=' + JSON.stringify(req.session.photos) + ']');
  res.render('upload');
});

app.post('/upload', multipartMiddleware, function (req, res, next) {
  try {
    var newImgPath = "/static/uploads/" + path.basename(url.parse(req.files.uploadFile.path).pathname);
    console.log('[new file to save] ' + newImgPath);
    fs.readFile(req.files.uploadFile.path, function (err, data) {
      fs.writeFile(__dirname + newImgPath, data, function (err) {
        if (err) 
          console.log('error: saving file[' + req.files.uploadFile.path + '|' + newImgPath + ']: ' + err);
        else {
          var molduras = nconf.get('molduras');
          var files = req.session.photos;
          var file = { posicao: molduras[req.body.molduraID].posicoes[req.body.posicaoID], file: newImgPath };
          files[req.body.posicaoID] = file;
          req.session.molduraID = req.body.molduraID;
          req.session.photos = files;
          req.session.save();
          res.redirect('/upload');
        }
      });
    });
  } catch (error) {
    console.log('error: ' + error);
  }
});

app.use('/static', express.static('static'));

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});

nconf.save();

/*
{
  uploadFile: {
    size: 11885,
    path: '/tmp/1574bb60b4f7e0211fd9ab48f932f3ab',
    name: 'avatar.png',
    type: 'image/png',
    lastModifiedDate: Sun, 05 Feb 2012 05:31:09 GMT,
    _writeStream: {
      path: '/tmp/1574bb60b4f7e0211fd9ab48f932f3ab',
      fd: 14,
      writable: false,
      flags: 'w',
      encoding: 'binary',
      mode: 438,
      bytesWritten: 11885,
      busy: false,
      _queue: [],
      drainable: true
    },
    length: [Getter],
    filename: [Getter],
    mime: [Getter]
  }
}
*/