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

//=========================================================
var Map = require('./server/simulation/classes/map-gen');
var fs = require("fs");
var saveDir = `./server/simulation/save`;
var settingsPath = `./server/settings/mapgen.json`;
var regenerate = true;
var players = {};

// console.log(mapSettings);
var map;
if (regenerate) {
  console.log('reading map settings json file');
  let mapSettingsData = fs.readFileSync(settingsPath);
  let mapSettings = JSON.parse(mapSettingsData);
  console.log('done reading map settings');
  map = new Map(mapSettings);
  map.generate(saveDir);
}
else{
  try {
    var saveJson = fs.readFileSync(saveDir + `/save.save`);
    var saveData = JSON.parse(saveJson);
    map = Object.assign(new Map, saveData);
  } catch (e) {
    console.error(e);
  }
}
// Add the WebSocket handlers
io.on('connection', function (socket) {
  socket.on('new player', function () {
    console.log(`player ${socket.id} joined`);
    //create player
    map.newPlayer(socket.id).then(person => {
      console.log(`person x: ${person.position.x}, y: ${person.position.y}`);
      players[socket.id] = {
        x: person.position.x,
        y: person.position.y,
        z: 2
      };
      // console.log('has veg settings: ' + JSON.stringify(map.vegetationSettings));
      io.sockets.emit('map', JSON.stringify(map));
      io.sockets.emit('camera', players[socket.id]);
    }).catch(err => {
      console.log(err);
      io.sockets.emit('error', JSON.stringify(err));
    });
  });
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
      if (chunkGenerated[0]){
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
});

setInterval(function () {
  //map.run();
  //let render = map.render();
  //console.log(render);
  //console.log(map.width * map.height);
  //io.sockets.emit('map',render,map.width, map.height);
  io.sockets.emit('state', players);
}, 1000 / 60);

setInterval(() => {
  map.saveData(saveDir);
}, 60 * 1000);

module.exports = io;