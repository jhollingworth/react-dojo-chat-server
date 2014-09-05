var _ = require('lodash');
var util = require('util');
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

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sow', function(req, res) {
  res.send(channels.sow());
});

app.post('/:channel/messages', function(req, res) {
  addMessage(req.params.channel, {
    text: req.body.text,
    username: req.body.username,
    timestamp: new Date(req.body.timestamp)
  });

  res.status(200).end();
});

app.post('/slack', function(req, res) {
  addMessage(req.body.channel_name, {
    text: req.body.text,
    username: req.body.user_name,
    timestamp: new Date(parseInt(req.body.timestamp) * 1000)
  });

  res.status(200).end();
});

channels.on('*', function() {
  console.log.apply(console, _.union([this.event], _.toArray(arguments)));
});

io.on('connection', function (socket) {
  socket.emit('sow', channels.sow());

  socket.on('message:send', function(channel, message) {
    channel.get(channel).messages.push(message);
  });

  socket.on('channel:join', function(channel, username) {
    channels.get(channel).join(username);
  });

  socket.on('channel:leave', function(channel, username) {
    channels.get(channel).leave(username);
  });

  channels.on('*', function(channel) {
    var args = _.toArray(arguments);
    args.unshift(this.event);

    socket.emit.apply(socket,  args);
  });
});

function addMessage(channel, message) {
  channels.get(channel).messages.push(message);
}

// setInterval(function() {
//   channels.get('foo').messages.push({
//     text: 'bar',
//     username: 'james',
//     timestamp: new Date()
//   });
// }, 1000);