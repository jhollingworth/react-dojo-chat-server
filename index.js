var _ = require('lodash');
var util = require('util');
var redis = require('./redis');
var app = require('express')();
var morgan = require('morgan');
var port = process.env.PORT || 5000;
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var channels = require('./channels');

server.listen(port);

app.use(morgan('dev'));
app.use(bodyParser());

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sow', function(req, res) {
  channels.all().then(function(sow) {
    res.send(sow);
  });
});

app.post('/:channel/messages', function(req, res) {
  var message = {
    text: req.body.text,
    username: req.body.username,
    timestamp: new Date(req.body.timestamp)
  };

  channels.addMessage(message, req.params.channel);

  res.status(200).end();
});

app.post('/slack', function(req, res) {
  var message = {
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
  channels.all().then(function(sow) {
    socket.emit('sow', sow);
  });

  socket.on('message:send', function(message, channel) {
    channels.addMessage(message, channel);
  });

  socket.on('channel:join', function(username, channel) {
    channels.addChannelMember(username, channel);
  });

  socket.on('channel:leave', function(username, channel) {
    channels.removeChannelMember(username, channel)
  });

  channels.on('*', function() {
    var args = _.toArray(arguments);
    args.unshift(this.event);

    socket.emit.apply(socket, args);
  });
});
// setInterval(function() {
//   channels.addMessage({
//     text: 'bar',
//     username: 'james',
//     timestamp: new Date()
//   }, 'foo');
// }, 1000);