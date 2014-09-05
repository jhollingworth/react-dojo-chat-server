var _ = require('lodash');
var util = require('util');
var array = require('array');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

function Channels() {
  var channels = {};

  this.add = add;
  this.get = get;
  this.sow = sow;

  EventEmitter2.call(this, {
    wildcard: true
  });

  function sow() {
    return _.chain(channels).values().invoke('sow').value();
  }

  function get(name) {
    return channels[name] || this.add(name);
  }

  function add(name) {
    var channel = channels[name] = new Channel(name, this);

    this.emit('channel:added', {
      channel: name
    });

    return channel;
  }
}

function Channel(name, channels) {
  var members = {};

  this.sow = sow;
  this.join = join;
  this.leave = leave;
  this.messages = array();

  this.messages.on('add', _.bind(onAdd, this));

  function onAdd(message) {
    this.join(message.username);
    channels.emit('message', {
      message: message,
      channel: name
    });
  }

  function join(username) {
    if (members[username]) {
      return;
    }

    members[username] = true;
    channels.emit('channel:joined', {
      channel: name,
      username: username
    });
  }

  function leave(username) {
    delete members[username];
    channels.emit('channel:left', {
      channel: name,
      username: username
    });
  }

  function sow() {
    return {
      name: name,
      messages: this.messages,
      members: Object.keys(members)
    };
  }
}

util.inherits(Channels, EventEmitter2);

module.exports = new Channels();