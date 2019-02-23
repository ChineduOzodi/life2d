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
var Map = require('./server/simulation/classes/map-gen');
var fs = require("fs");
var vegLocation = `./server/simulation/entities/vegetation`;
var peopleLocation = `./server/simulation/entities/people`;
var savePath = `./server/simulation/save/save.json`;

console.log('reading map settings json file');
var mapSettingsData = fs.readFileSync('./server/settings/mapgen.json');

var saveJson = fs.readFileSync(savePath);
var saveData = JSON.parse(saveJson);
var mapSettings = JSON.parse(mapSettingsData);

var pendingChunks = [];
var players = {};

console.log('done reading map settings');
// console.log(mapSettings);
var map = new Map(mapSettings, saveData);
fs.readdir(vegLocation, (err, files) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log(`loading vegetation`);
    files.forEach(x => {
      let vegJson = fs.readFileSync(`${vegLocation}/${x}`);
      let vegData = JSON.parse(vegJson);
      map.vegetationSettings.push(vegData);
      // console.log(vegData);
    });
    console.log(`done loading vegetation`);
  }
});

fs.readdir(peopleLocation, (err, files) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log(`loading people settings`);
    files.forEach(x => {
      let json = fs.readFileSync(`${peopleLocation}/${x}`);
      let data = JSON.parse(json);
      map.peopleSettings.push(data);
      // console.log(data);
    });
    console.log(`done loading people settings`);
  }
})
map.setMap(savePath);
// map.generateMapChunk('topLeft', - map.settings.width / 2 * map.settings.scale, - map.settings.height / 2 * map.settings.scale, map.settings.width, map.settings.height, map.settings.scale / 2);
// map.generateMap().then( () => {
//   io.sockets.emit('map');
// });
//map.generateMap(mWidth, mHeight, 4);
//console.log(map.render());

io.on('connection', function (socket) {
  socket.on('new player', function () {
    console.log(`player ${socket.id} joined`);
    //create player
    let person = map.newPlayer(socket.id);
    console.log(`person x: ${person.position.x}, y: ${person.position.y}`);
    players[socket.id] = {
      x: person.position.x,
      y: person.position.y,
      z: 2,
      chunkNames: []
    };
    checkMapChunking(socket.id);
    // console.log('has veg settings: ' + JSON.stringify(map.vegetationSettings));
    io.sockets.emit('map', JSON.stringify(map));
    io.sockets.emit('camera', players[socket.id]);
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

      let topX = Math.floor(player.x / (chunkSettings.width * chunkSettings.scale)) * chunkSettings.width * chunkSettings.scale;
      let topY = Math.floor(player.y / (chunkSettings.height * chunkSettings.scale)) * chunkSettings.height * chunkSettings.scale;

      let chunkName = `x${topX}y${topY}w${chunkSettings.width}h${chunkSettings.height}s${chunkSettings.scale}`;

      if (player.chunkNames.indexOf(chunkName) < 0) {
        //check if file already exists
        if (pendingChunks.indexOf(chunkName) >= 0) {
          console.log(`already generating ${chunkName}`);
        } else if (map.chunkNames.indexOf(chunkName) >= 0) {
          //file exists
          console.log('file exists');
          var chunkSaveData = fs.readFileSync(`./server/simulation/map/${chunkName}.json`);
          var chunkData = JSON.parse(chunkSaveData);
          player.chunkNames.push(chunkData.name);
          console.log(`pushing chunk ${chunkData.name} to player ${id}`);
          io.sockets.connected[id].emit('mapChunkAdd', chunkData);
        } else {
          pendingChunks.push(chunkName);
          //create map chunk
          map.generateMapChunk(chunkName, topX, topY, chunkSettings.width, chunkSettings.height, chunkSettings.scale, chunkSettings.generate).then((chunkData) => {
            map.chunkNames.push(chunkName);
            for (let b = 0; b < pendingChunks.length; b++) {
              if (pendingChunks[b] === chunkName) {
                pendingChunks.splice(b, 1);
              }
            }
            player.chunkNames.push(chunkData.name);
            console.log(`pushing chunk ${chunkData.name} to player ${id}`);
            // console.log(chunkData);
            io.sockets.connected[id].emit('mapChunkAdd', chunkData);
            io.sockets.emit('vegetation', map.vegetation);
          }).catch(err => {
            console.log(err);
            for (let b = 0; b < pendingChunks.length; b++) {
              if (pendingChunks[b] === chunkName) {
                pendingChunks.splice(b, 1);
              }
            }
          })
        }
      }
    }
  }
}

setInterval(() => {
  map.saveData(savePath);
}, 60 * 1000);