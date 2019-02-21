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
var mHeight = 600;
// var mWidth = 100;
// var mHeight = 100;
var Map = require('./server/simulation/map-gen');
var fs = require("fs");

console.log('reading map settings json file');
var mapSettingsData = fs.readFileSync('./server/settings/mapgen.json');
var mapSettings = JSON.parse(mapSettingsData);
var players = {};
console.log('done reading map settings');
console.log(mapSettings);

var map = new Map(mapSettings);
map.randomMap();
// map.generateMap().then( () => {
//   io.sockets.emit('map');
// });
//map.generateMap(mWidth, mHeight, 4);
//console.log(map.render());

io.on('connection', function (socket) {
  socket.on('new player', function () {
    players[socket.id] = {
      x: 0,
      y: 0,
      z: 1,
      chunkNames: []
    };
    io.sockets.emit('map', JSON.stringify(map));
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
    checkMapChunking(socket.id);
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

function checkMapChunking(id) {
  for (let i = 0; i < map.settings.mapChunks.length; i++) {
    const chunkSettings = map.settings.mapChunks[i];
    // console.log(players);
    let player = players[id];
    //check if player position meets criteria
    if (player.z > chunkSettings.minZoom &&
      player.z < chunkSettings.maxZoom) {

      //determine chunk name

      let topX = Math.floor(player.x / (chunkSettings.width * chunkSettings.scale)) * chunkSettings.width * chunkSettings.scale - (chunkSettings.width * chunkSettings.scale) / 2;
      let topY = Math.floor(player.x / (chunkSettings.height * chunkSettings.scale)) * chunkSettings.height * chunkSettings.scale - (chunkSettings.height * chunkSettings.scale) / 2;

      let chunkName = `x${topX}y${topY}w${chunkSettings.width}h${chunkSettings.height}s${chunkSettings.scale}`;

      if (player.chunkNames.indexOf(chunkName) < 0) {
        //check if file already exists
        if (fs.existsSync(`./server/simulation/map/${chunkName}.json`)) {
          //file exists
          console.log('file exists');
          var chunkSaveData = fs.readFileSync(`./server/simulation/map/${chunkName}.json`);
          var chunkData = JSON.parse(chunkSaveData);
          player.chunkNames.push(chunkData.name);
          console.log('pushing chunk data to player ' + id);
          io.sockets.connected[id].emit('mapChunkAdd', chunkData);
        } else {
          //create map chunk
          map.generateMapChunk(chunkName, topX, topY, chunkSettings.width, chunkSettings.height, chunkSettings.scale).then((chunkData) => {
            player.chunkNames.push(chunkData.name);
            console.log('pushing chunk data to player ' + id);
            console.log(chunkData);
            io.sockets.connected[id].emit('mapChunkAdd', chunkData);
          }).catch(err => {
            console.log(err);
          })
        }
      }
    }
  }
}