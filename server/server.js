// Dependencies
var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var path = require('path');
var socketIO = require('socket.io');
var io = socketIO(server);
var fs = require("fs");
//simulation classes
var Map = require('./server/simulation/classes/map-gen');
var Goap = require('./server/simulation/classes/goap');
var Camera = require('./server/simulation/classes/camera');
var User = require('./server/simulation/classes/user');

//global variables
var saveDir = `./server/simulation/save`;
var settingsPath = `./server/settings/mapgen.json`;
var goapActionsPath = `./server/simulation/entities`;
var regenerate = true;
var players = {};
var users = {};
var map;

//=========================================

//server setup
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

// simulation setup

if (regenerate) {
  console.log('reading map settings json file');
  let mapSettingsData = fs.readFileSync(settingsPath);
  let mapSettings = JSON.parse(mapSettingsData);
  console.log('done reading map settings');
  map = new Map(mapSettings);
  map.generate(saveDir);
}
else {
  try {
    var saveJson = fs.readFileSync(saveDir + `/save.save`);
    var saveData = JSON.parse(saveJson);
    map = Object.assign(new Map, saveData);
    map.correctClasses();
  } catch (e) {
    console.error(e);
  }
}

//GOAP setup
var goap = new Goap();
console.log('laoding goap actions');
goap.loadActions(goapActionsPath).then(() => {
  // console.log(JSON.stringify(goap.actions));
  console.log(`goap action loading complete`);
});

// Add the WebSocket handlers
io.on('connection', function (socket) {
  socket.on('camera', function (data) {
    let player = players[socket.id] || {};
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    if (!players[socket.id]) {
      players[socket.id] = player;
      players[socket.id].chunkNames = [];
    }
    map.checkMapChunking(player.x, player.y, player.z).then((chunkGenerated) => {
      if (chunkGenerated[0]) {
        let values = chunkGenerated[1]
        // console.log(`server - chunkGen: ${chunkGenerated}, data: ${JSON.stringify(values)}`);
        for (let c = 0; c < values.length; c++) {
          const chunkData = values[c];
          console.log(`pushing chunk ${chunkData.name} to players`);
          io.sockets.emit('mapChunkAdd', chunkData);
        }
        io.sockets.emit('vegetation', thisMap.vegetation);
      }
    });
    //console.log(`x: ${player.x}, y: ${player.y}, zoom: ${player.z}`)
  });
  socket.on('login', function (username) {
    console.log(`${username} logged in`);
    if (users[username]) {
      users[username].sockerId = socket.id;
      io.to(socket.id).emit('user', users[username]);
    } else {
      //create player
      map.newPlayer(socket.id).then(person => {
        console.log(`person x: ${person.position.x}, y: ${person.position.y}`);
        users[username] = new User(socket.id,username, new Camera(person.position,5));
        // console.log('has veg settings: ' + JSON.stringify(map.vegetationSettings));
        io.to(socket.id).emit('user', users[username]);
        io.to(socket.id).emit('map', JSON.stringify(map));
        person.setGoal('build wooden shelter', goap, map);
      }).catch(err => {
        console.log(err);
        io.sockets.emit('error', JSON.stringify(err));
      });
    }
  });
});

setInterval(function () {
  map.run();
  io.sockets.emit('people', map.people);
  io.sockets.emit('state', players);
}, 1000 / 60);

setInterval(() => {
  map.saveData(saveDir);
}, 60 * 1000);

module.exports = io;