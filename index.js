var fs = require('fs');
var _ = require('lodash');
var util = require('util');
var uuid = require('uuid').v1;
var redis = require('./redis');
var app = require('express')();
var morgan = require('morgan');
var port = process.env.PORT || 5000;
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var channels = require('./channels');
var security = require('./security.json');

console.log("keys", security.keys);

server.listen(port);

app.use(morgan('dev'));
app.use(bodyParser());
app.use(function(req, res, next) {
  if (validKey(req.query.key)) {
    next();
  } else {
    res.status(401).end();
  }
});

console.log("Chat server: http://localhost:" + port);

app.get('/', function(req, res) {
  var index = fs.readFileSync(__dirname + '/index.html', 'utf-8').replace("{{key}}", security.keys[0]);
  res.set('Content-Type', 'text/html');
  res.send(index);
});

app.get('/sow', function(req, res) {
  channels.all().then(function(sow) {
    res.send(sow);
  });
});

app.get('/flushall', function(req, res) {
  redis.flushall().then(function() {
    res.send("Messages deleted");
  });
})

app.post('/:channel/messages', function(req, res) {
  var message = {
    id: uuid(),
    text: req.body.text,
    username: req.body.username,
    timestamp: new Date(req.body.timestamp)
  };

  channels.addMessage(message, req.params.channel);

  res.status(200).end();
});

app.post('/slack', function(req, res) {
  var message = {
    id: uuid(),
    text: req.body.text,
    username: req.body.user_name,
    timestamp: new Date(parseInt(req.body.timestamp) * 1000)
  };

  channels.addMessage(message, req.body.channel_name);

  res.status(200).end();
});

channels.on('*', function() {
  console.log.apply(console, _.union([this.event], _.toArray(arguments)));
});

io.on('connection', function(socket) {
  if (!validUrl(socket.client.request.url)) {
    socket.disconnect('unauthorized');
  }

  channels.all().then(function(sow) {
    socket.emit('sow', sow);
  });

  socket.on('message', function(message, channel) {
    message.id = uuid();
    channels.addMessage(message, channel);
  });

  socket.on('channel:left', function(username, channel) {
    channels.removeChannelMember(username, channel)
  });

  socket.on('channel:joined', function(username, channel) {
    channels.addChannelMember(username, channel);
  });

  channels.on('*', function() {
    var args = _.toArray(arguments);
    args.unshift(this.event);
    socket.emit.apply(socket, args);
  });
});


function validUrl(url) {
  var match = new RegExp(/key=(.*?)&/).exec(url);

  return match && validKey(match[1]);
}

function validKey(key) {
  var valid = key && security.keys.indexOf(key.toString().toLowerCase()) !== -1;

  if (!valid) {
    console.error("Invalid security key", key, '\nValid keys:' + security.keys.join(', '));
  }

  return valid;
}
// setInterval(function() {
//   channels.addMessage({
//     text: 'bar',
//     username: 'james',
//     timestamp: new Date()
//   }, 'foo');
// }, 1000);