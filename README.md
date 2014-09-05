#React Dojo Chart Server

A simple socket.io chat app we will use to build something with in react.

The app knows about a number of channels, which have members and messages. 


##How do I?

* Install all dependencies ```make bootstrap```
* Run the application ```make start```
* Deploy ```make deploy```

##Socket.io

###Requests

* ``message:send(channel, message``: Send a message
* ``channel:join(channel, username)``: Join a channel
* ``channel:leave(channel, username)``: Leave a channel

###Events

* ``message``: A message has been sent
* ``channel:added``: A new channel has been added
* ``channel:joined``: A user has joined a channel
* ``channel:left``: A user has left a channel

##HTTP Endpoints

* ``GET /sow``: Gets current state of the world
* ``POST /slack``: Slack webhook
* ``POST /channels/:channel/messages``: Post message to a channel

###Message schema

```
{
  text: "Hello world",
  username: "jhollingworth",
  timestamp: "2014-09-05T21:29:01.000Z"
}
```