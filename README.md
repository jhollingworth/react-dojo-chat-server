#React Dojo Chart Server

A simple socket.io chat app we will use to build something with in react.

The app knows about a number of channels, which have members and messages.


##How do I?

* Install all dependencies ```make bootstrap```
* Run the application ```make start```
* Deploy ```make deploy```

##Socket.io

###Client events

* ``message#(message, channel)``: Send a message
* ``channel:joined#(username, channel)``: Join a channel
* ``channel:left#(username, channel)``: Leave a channel

###Server events

* ``message``: A message has been sent
* ``channel:left``: A user has left a channel
* ``channel:joined``: A user has joined a channel
* ``channel:created``: A new channel has been created

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