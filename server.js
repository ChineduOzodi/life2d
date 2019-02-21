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
var Map = require('./server/simulation/map-gen');
var fs = require("fs");
var vegLocation = `./server/simulation/entities/vegitation`;
var savePath = `./server/simulation/save/save.json`;

console.log('reading map settings json file');
var mapSettingsData = fs.readFileSync('./server/settings/mapgen.json');
var chunkManifestJson = fs.readFileSync('./server/simulation/map/manifest.json');
var saveJson = fs.readFileSync(savePath);
var saveData = JSON.parse(saveJson);
var mapSettings = JSON.parse(mapSettingsData);
var chunkManifest = JSON.parse(chunkManifestJson);
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
      map.vegitationSettings.push(vegData);
      // console.log(vegData);
    });
    console.log(`done loading vegitation`);
  }
})
map.setMap(chunkManifest);
// map.generateMapChunk('topLeft', - map.settings.width / 2 * map.settings.scale, - map.settings.height / 2 * map.settings.scale, map.settings.width, map.settings.height, map.settings.scale / 2);
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
      let topY = Math.floor(player.y / (chunkSettings.height * chunkSettings.scale)) * chunkSettings.height * chunkSettings.scale - (chunkSettings.height * chunkSettings.scale) / 2;

      let chunkName = `x${topX}y${topY}w${chunkSettings.width}h${chunkSettings.height}s${chunkSettings.scale}`;

      if (player.chunkNames.indexOf(chunkName) < 0) {
        //check if file already exists
        if (chunkManifest.chunkNames.indexOf(chunkName) >= 0) {
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
            chunkManifest.chunkNames.push(chunkData.name);
            fs.writeFileSync(`./server/simulation/map/manifest.json`, JSON.stringify(chunkManifest));
            console.log('pushing chunk data to player ' + id);
            console.log(chunkData);
            io.sockets.connected[id].emit('mapChunkAdd', chunkData);
            if (chunkData.generate) {
              let iX = 0;
              for (let x = topX; x < topX + width * scale; x += scale) {
                let iY = 0;
                for (let y = topY; y < topY + height * scale; y += scale) {
                  let amplitude = 1;
                  let frequency = 1;
                  let noiseHeight = 0;
                  for (let i = 0; i < this.settings.noise.octaves; i++) {
                    //console.log(`offsets: ${this.settings.noise.offsets}`);
                    let xOff = this.settings.noise.offsets[i][0];
                    let yOff = this.settings.noise.offsets[i][1];
                    let sampleX = xOff + x * this.settings.noise.scale * frequency;
                    let sampleY = yOff + y * this.settings.noise.scale * frequency;
                    let h = simplex.noise2D(sampleX, sampleY);
                    noiseHeight += h * amplitude;
                    amplitude *= this.settings.noise.persistence;
                    frequency *= this.settings.noise.lacunarity;
                  }

                  map[iX].push({
                    height: lerp(this.settings.noise.minNoiseHeight, this.settings.noise.maxNoiseHeight, noiseHeight),
                    x: x,
                    y: y
                  });

                  //add biomes
                  // console.log(map[iX][iY].height);
                  var b = biome(map[iX][iY].height);
                  map[iX][iY].biome = b[0];
                  map[iX][iY].biomeColor = b[1];

                  iY++;
                }
                iX++;
              }
            }
          }).catch(err => {
            console.log(err);
          })
        }
      }
    }
  }
}