var client = createClient();
var Promise = require('bluebird');
var commands = ['lrange', 'sadd', 'smembers', 'rpush', 'srem', 'sismember'];

commands.forEach(function(command) {
  client[command] = Promise.promisify(client[command]);
});

client.on('error', function(err) {
  console.error('Redis error', err);
});

module.exports = client;

function createClient() {
  var client;

  if (process.env.REDISTOGO_URL) {
    var rtg = require("url").parse(process.env.REDISTOGO_URL);
    client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
  } else {
    client = require("redis").createClient();
  }

  return client;
}