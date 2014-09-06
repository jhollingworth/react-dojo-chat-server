var _ = require('lodash');
var util = require('util');
var redis = require('./redis');
var Promise = require('bluebird');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

function Channels() {
  this.all = all;
  this.get = get;
  this.addMessage = addMessage;
  this.addChannelMember = addChannelMember;
  this.removeChannelMember = removeChannelMember;

  EventEmitter2.call(this, {
    wildcard: true
  });

  var emit = _.bind(this.emit, this);

  function get(channel) {
    return Promise.join(
      getChannelMembers(channel),
      getChannelMessages(channel)
    ).then(buildChannel);

    function buildChannel(res) {
      var members = res[0];
      var messages = res[1];

      return {
        name: channel,
        members: members,
        messages: messages
      };
    }
  }

  function getChannelMembers(channel) {
    return redis.smembers(channelMembersKey(channel));
  }

  function getChannelMessages(channel) {
    return redis.lrange(channelMessagesKey(channel), 0, -1).then(function(messages) {
      return messages.map(function(message) {
        return JSON.parse(message);
      });
    });
  }

  function all() {
    return redis.smembers("channels").then(function(channels) {
      return Promise.all(channels.map(get));
    });
  }

  function addChannel(channel) {
    return redis.sismember("channels", channel).then(function (isMember) {
      if (!isMember) {
        return redis.sadd("channels", channel).then(emitEvent);
      }
    });

    function emitEvent() {
      emit('channel:created', {
        channel: channel
      });
    }
  }

  function addMessage(message, channel) {
    return Promise.join(
      addChannel(channel),
      addChannelMember(message.username, channel),
      redis.rpush(channelMessagesKey(channel), JSON.stringify(message))
    ).then(emitEvent);

    function emitEvent() {
      emit('message', {
        message: message,
        channel: channel
      });
    }
  }

  function addChannelMember(username, channel) {
    return redis.sismember(channelMembersKey(channel), username).then(function (isMember) {
      if (!isMember) {
        return joinChannel();
      }
    });

    function joinChannel() {
      return redis.sadd(channelMembersKey(channel), username)
                  .then(emitEvent);
    }

    function emitEvent() {
      emit('channel:joined', {
        channel: channel,
        username: username
      });
    }
  }

  function removeChannelMember(username, channel) {
    return redis.srem(channelMembersKey(channel), username)
                .then(emitEvent);

    function emitEvent() {
      emit('channel:left', {
        channel: channel,
        username: username
      });
    };
  }

  function channelKey(channel) {
    return "channels:" + channel;
  }

  function channelMessagesKey(channel) {
    return channelKey(channel) + ":messages";
  }

  function channelMembersKey(channel) {
    return channelKey(channel) + ":members";
  }
}

util.inherits(Channels, EventEmitter2);

module.exports = new Channels();