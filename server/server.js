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
var Goap = require('./server/simulation/classes/goap/goap');
var Camera = require('./server/simulation/classes/camera');
var User = require('./server/simulation/classes/user');
var GoapPlanner = require('./server/simulation/classes/goap/goap-planner');
var AStar = require('./server/simulation/classes/a-star/a-star');

//global variables
var saveDir = `./server/simulation/save`;
var settingsPath = `./server/settings/mapgen.json`;
var goapActionsPath = `./server/simulation/entities`;
var regenerate = true;
var players = {};
var users = {};
var map;
var goapPlanner = new GoapPlanner();
var aStar = new AStar();
//=========================================

//server setup
app.set('port', 5000);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
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
  map.data = [
    {
      series: [{name: 0, value: 0}],
      name: 'Vegetation'
    },
    {
      series: [{name: 0, value: 0}],
      name: 'Average Health'
    },
    {
      series: [{name: 0, value: 0}],
      name: 'Average Age'
    }, {
      series: [{name: 0, value: 0}],
      name: 'Average Duplication'
    },
    {
      series: [{name: 0, value: 0}],
      name: 'Herbivores'
    }
  ];
  map.interval = 60;
  map.currentLatestTime = 60;
  map.currentIndex = 0;
} else {
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
goapPlanner.goap = new Goap();
console.log('laoding goap actions');
goapPlanner.goap.loadActions(goapActionsPath).then(() => {
  // console.log(JSON.stringify(goap.actions));
  console.log(`goap action loading complete`);
});

function updateData(map) {
  let totalEntities = 0;
  let totalHerbs = 0;
  let averageAge = 0;
  let averageDuplication = 0;
  let totalVegetation = 0;
  let averageHealth = 0;
  for (const entity of map.entities) {
    if (!entity.destroy) {
      totalEntities++;
      if (entity.type === 'vegetation') {
        totalVegetation++;
        averageAge += entity.age;
        let duplicate = entity.getTrait('duplicate')
        averageDuplication += duplicate.base;
        averageHealth += entity.health;
      } else {
        totalHerbs++;
      }
    }
  }

  averageAge /= totalVegetation;
  averageDuplication /= totalVegetation;
  averageHealth /= totalVegetation;

  // console.log(`average age: ${averageAge}`);

  if (map.time > map.currentLatestTime) {
    map.currentIndex++;
    map.currentLatestTime += map.interval;
    let name = (map.currentLatestTime / 60);
    for (const data of map.data) {
      data.series.push({name: name, value: 0});
    }
  }

  for (let i in map.data) {
    let data = map.data[i];
    // console.log(JSON.stringify(data));
    // console.log(`i: ${i}`);
    if (i == 0) {
      data.series[map.currentIndex].value = totalEntities;
      // console.log(`total entities: ${data.data[map.currentIndex]}`);
    } else if (i == 1) {
      data.series[map.currentIndex].value = averageHealth;
    } else if (i == 2) {
      data.series[map.currentIndex].value = averageAge;
    } else if (i == 3) {
      data.series[map.currentIndex].value = averageDuplication;
    } else if (i == 4) {
      data.series[map.currentIndex].value = totalHerbs;
    } 
  }
}

// Add the WebSocket handlers
io.on('connection', function (socket) {
  socket.on('login', function (username) {
    if (users[username]) {
      console.log(`${username} logged in`);
      players[socket.id] = username;
      delete players[users[username].socketId]
      users[username].socketId = socket.id;
    } else {
      //create player
      console.log(`new user ${username} logged in`);
      players[socket.id] = username;
      const x = 0;
      const y = 0;
      console.log(`x: ${x}, y: ${y}`);
      users[username] = new User(socket.id, username, socket.id, new Camera({ x: x, y: y }, 5));
    }

    io.to(socket.id).emit('user', users[username]);
    io.to(socket.id).emit('map', map);
    io.to(socket.id).emit('goapActions', goapPlanner.goap.actions);

  });
  socket.on('camera', function (camera) {
    // console.log('camera: ' + JSON.stringify(camera));
    let user = users[players[socket.id]];
    // console.log('user: ' + JSON.stringify(user));
    if (user) {
      user.camera = camera;
      map.checkMapChunking(user.camera.position, user.camera.zoomLevel).then((chunkGenerated) => {
        if (chunkGenerated[0]) {
          let values = chunkGenerated[1]
          // console.log(`server - chunkGen: ${chunkGenerated}, data: ${JSON.stringify(values)}`);
          for (let c = 0; c < values.length; c++) {
            const chunkData = values[c];
            console.log(`pushing chunk ${chunkData.name} to players`);
            io.sockets.emit('mapChunkAdd', chunkData);
          }
        }
      });
    } else {
      io.to(socket.id).emit('logout');
    }

    //console.log(`x: ${player.x}, y: ${player.y}, zoom: ${player.z}`)
  });
  socket.on('setPersonGoal', function (goal) {
    // console.log('camera: ' + JSON.stringify(camera));
    let user = users[players[socket.id]];
    // console.log('user: ' + JSON.stringify(user));
    if (user) {
      let person = map.people.find(x => x.id == user.username);
      person.goals.push(goal);
    } else {
      io.to(socket.id).emit('logout');
    }

    //console.log(`x: ${player.x}, y: ${player.y}, zoom: ${player.z}`)
  });
});

function run () {
  map.run(goapPlanner, 1 / 60, aStar);
  // console.log(`sending entity: ${JSON.stringify(map.entities[1])}`);
  io.sockets.emit('entities', map.entities);
  io.sockets.emit('state', players);
  if (map.locationReserveChanged) {
    map.locationReserveChanged = false;
    io.sockets.emit('locationReservations', map.locationReservations);
  }
  setTimeout( run, 1000/60);
}

setInterval(function () {
  updateData(map);
  io.sockets.emit('data', map.data);
}, 1000);

setInterval(() => {
  map.saveData(saveDir);
  // console.log(JSON.stringify(map.data));
}, 60 * 1000);

run();
module.exports = io;