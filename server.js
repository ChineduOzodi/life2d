// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname + '/static/', 'index.html'));
});
// Starts the server.
server.listen(5000, function () {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
io.on('connection', function (socket) {
});

//=========================================================
var mWidth = 1000;
var mHeight = 400;
// var mWidth = 100;
// var mHeight = 100;
var Map = require('./server/map-gen');
var players = {};
var map = new Map(mWidth,mHeight,4);
map.generateMap().then( () => {
  io.sockets.emit('map');
});
//map.generateMap(mWidth, mHeight, 4);
//console.log(map.render());

io.on('connection', function (socket) {
  socket.on('new player', function () {
    players[socket.id] = {
      x: 300,
      y: 300
    };
    //io.sockets.emit('map',map.renderAll(),map.width, map.height);
  });
  socket.on('movement', function (data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });

});

setInterval(function () {
  map.run();
  let render = map.render();
  //console.log(render);
  //console.log(map.width * map.height);
  //io.sockets.emit('map',render,map.width, map.height);
  io.sockets.emit('state', players);
}, 1000 / 60);

//generate map