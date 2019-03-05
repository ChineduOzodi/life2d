var Person = require('./person');
var Vegetation = require('./vegetation');
var math = require('mathjs');
var SimplexNoise = require('simplex-noise');
var PNGImage = require('pngjs-image');
var fs = require("fs");

function Map(settings) {
  if (settings) {
    this.name = settings.name;
    this.width = settings.width;
    this.height = settings.height;
    this.scale = settings.scale;
    this.settings = settings;
  }
  this.cities = [];
  this.vegetationSettings = [];
  this.peopleSettings = [];
  this.pendingChunks = [];
  this.vegetation = [];
  this.people = [];
  this.chunkData = {};
  this.id = 1;
  this.map = {};
}

Map.prototype.run = function () {
  if (this.people.length > 0) {
    // console.log(JSON.stringify(this.people));
    for (i in this.people) {
      let person = this.people[i];
      person.run(this);
    }
  }
}

Map.prototype.saveData = function (dir) {
  map = this;
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFile(dir + '/save.save', JSON.stringify(map), (err) => {
      if (err) {
        console.log(`could not save map data`);
        reject(err);
      } else {
        console.log('sim saved');
        resolve();
      }
    });
  })
}

Map.prototype.correctClasses = function() {
  this.people = assignClasses(this.people, Person);
  this.vegetation = assignClasses(this.vegetation, Vegetation);
  console.log('classes corrected');
}

assignClasses = function(location, Class) {
  let assignedList = [];
  for (let k of Object.keys(location)) {
    let object = location[k];
    assignedList.push(Object.assign(new Class, object));
  }
  return assignedList;
}


Map.prototype.generate = function (saveDir) {
  map = this;
  return new Promise((resolve, reject) => {
    if (map.settings.randomSeed == true) {
      map.settings.seed = math.random(0, 100);
      console.log(`created new random seed for map`);
    }
    //get veg settings

    map.randomMap().then(() => {
      console.log('saving to file');
      fs.writeFileSync('./server/settings/mapgen.json', JSON.stringify(thisMap.settings));
      console.log('finished saving settings to file');
      let promises = [];
      let vegLocation = map.settings.locations.vegLocation;
      let peopleLocation = map.settings.locations.peopleLocation;
      promises.push(map.setClassSettings(map.vegetationSettings, vegLocation));
      promises.push(map.setClassSettings(map.peopleSettings, peopleLocation));

      //settings all loaded and set
      Promise.all(promises).then(() => {
        map.saveData(saveDir).then(() => {
          resolve();
        }).catch((err) => {
          console.log(`error occured saving map data in map generation`);
          reject(err);
        });
      }).catch(err => {
        console.log(`error occured with loading and settings class settings in map generation`);
        reject(err);
      });
    });
  });
}

Map.prototype.setClassSettings = function (location, dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err);
      }
      else {
        console.log(`loading settings from ${dir}`);
        files.forEach(x => {
          let json = fs.readFileSync(`${dir}/${x}`);
          let data = JSON.parse(json);
          location.push(data);
          // console.log(vegData);
        });
        console.log(`done saving settings from ${dir}`);
        resolve();
      }
    });
  })
}

Map.prototype.deleteSaveData = function () {
  let dir = `./static/map`;
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(err);
    }
    else {
      console.log(`deleting files in ${dir}`);
      // console.log(`files: ${JSON.stringify(files)}`);
      files.forEach(x => {
        let path = `${dir}/${x}`
        fs.unlink(path, (err) => {
          if (err) {
            console.error('error removing chunk png');
            // console.log(`path: ${path}`);
            console.error(err);
          }
        });
      });
    }
  });
}

Map.prototype.randomMap = function () {
  thisMap = this;
  return new Promise((resolve, reject) => {
    //console.log(`OFFSETS: ${thisMap.settings.noise.offsets}`);
    //create offsets
    if (thisMap.settings.noise.randomSeed) {
      thisMap.deleteSaveData();
      thisMap.chunkData = {};
      console.log("Generating new map...");
      thisMap.settings.noise.seed = math.random(0, 100);
      thisMap.settings.noise.offsets = [];
      for (let i = 0; i < thisMap.settings.noise.octaves; i++) {
        thisMap.settings.noise.offsets.push([math.random(-100000, 100000), math.random(-100000, 100000)]);
      }
      //console.log(`OFFSETS: ${thisMap.settings.noise.offsets}`);
      thisMap.generateMap().then(() => {
        //save settings
        resolve();
      }).catch((err) => {
        console.log(`something went wrong with random map generation`);
        reject(err);
      });
    } else {
      console.log('no new map generation, settings.noise.randomSeed not set to true');
      resolve();
    }
  })

}

Map.prototype.newPlayer = function (id) {
  thisMap = this;
  return new Promise((resolve, reject) => {
    let count = 0;
    let found = false;
    while (count < 1002) {
      count++;
      let randomX = Math.floor(Math.random() * thisMap.width * thisMap.scale - thisMap.width * 0.5 * thisMap.scale);
      let randomY = Math.floor(Math.random() * thisMap.height * thisMap.scale - thisMap.height * 0.5 * thisMap.scale);
      // console.log(`info: w: ${thisMap.width}, s: ${thisMap.scale}`)
      // console.log(`random x: ${randomX}, y: ${randomY}`);
      let shouldBreak = false;
      // console.log(JSON.stringify(thisMap.vegetationSettings));
      for (let i = 0; i < thisMap.peopleSettings.length; i++) {
        const entitySettings = thisMap.peopleSettings[i];
        for (let b = 0; b < entitySettings.spawnSettings.biomes.length; b++) {
          const biome = entitySettings.spawnSettings.biomes[b];
          if (thisMap.getBiome(randomX, randomY)[0] === biome.name) {
            shouldBreak = true;
            found = true;
            let v = Math.floor(Math.random() * entitySettings.baseSprites.length);
            let person = new Person(id, randomX, randomY, entitySettings.baseSpeed, i, v);
            thisMap.people.push(person);
            thisMap.checkMapChunking({x: randomX, y: randomY}, 1).then(() => {
              resolve(person);
            }).catch((err) => {
              reject(err);
            });
          } else if (count > 1000) {
            shouldBreak = true;
            reject('people creation reached count limit, found person did not find free spot');
          }
          if (shouldBreak) {
            break;
          }
        }
        if (shouldBreak) {
          break;
        }
      }
      if (shouldBreak) {
        break;
      }
    }
    if (!found) {
      reject('people creation reached count limit, did not find person');
    }
  })
}

Map.prototype.checkMapChunking = function (position, zoomLevel) {
  let thisMap = this;
  return new Promise((resolve, reject) => {
    let promises = [];
    let chunkGenerated = false;
    for (let i = 0; i < thisMap.settings.mapChunks.length; i++) {
      const chunkSettings = thisMap.settings.mapChunks[i];
      // console.log(players);
      //check if player position meets criteria
      if (zoomLevel > chunkSettings.minZoom &&
        zoomLevel < chunkSettings.maxZoom) {

        //determine chunk name
        let topX = Math.floor(position.x / (chunkSettings.width * chunkSettings.scale)) * chunkSettings.width * chunkSettings.scale;
        let topY = Math.floor(position.y / (chunkSettings.height * chunkSettings.scale)) * chunkSettings.height * chunkSettings.scale;

        let chunkName = `x${topX}y${topY}w${chunkSettings.width}h${chunkSettings.height}s${chunkSettings.scale}`;

        if (!thisMap.chunkData[chunkName]) {
          //check if file already exists
          if (thisMap.pendingChunks.indexOf(chunkName) >= 0) {
            console.log(`already generating ${chunkName}`);
          }
          else {
            thisMap.pendingChunks.push(chunkName);
            //create map chunk
            promises.push(thisMap.generateMapChunk(chunkName, topX, topY, chunkSettings.width, chunkSettings.height, chunkSettings.scale, chunkSettings.generate));
            chunkGenerated = true;
          }
        }
      }
    }
    Promise.all(promises).then((values) => {
      for (let c = 0; c < values.length; c++) {
        const chunkData = values[c];
        for (let b = 0; b < thisMap.pendingChunks.length; b++) {
          if (thisMap.pendingChunks[b] === chunkData.name) {
            thisMap.pendingChunks.splice(b, 1);
            break;
          }
        }
      }
      // console.log(`map-gen - chunkGen: ${chunkGenerated}, data: ${JSON.stringify(values)}`);
      resolve([chunkGenerated, values]);
    }).catch(err => {
      //resets pending chunks
      console.log(`error occured, reseting pending chunks`);
      thisMap.pendingChunks = [];
      reject(err);
    })
  })

}

Map.prototype.generateMap = function () {

  this.cities = [];
  map = [];
  var simplex = new SimplexNoise(this.settings.noise.seed);
  console.log("Generating map...");

  let iX = 0;
  for (let x = - this.settings.width / 2 * this.settings.scale; x < this.settings.width / 2 * this.settings.scale; x += this.settings.scale) {
    map.push([]);
    for (let y = - this.settings.height / 2 * this.settings.scale; y < this.settings.height / 2 * this.settings.scale; y += this.settings.scale) {
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
      //var index = (x + y * width) * 4;

      //console.log(noiseHeight);
      if (noiseHeight > this.settings.noise.maxNoiseHeight) {
        this.settings.noise.maxNoiseHeight = noiseHeight;
      } else if (noiseHeight < this.settings.noise.minNoiseHeight) {
        this.settings.noise.minNoiseHeight = noiseHeight;
      }
      //console.log(b);
      let tile = {height:noiseHeight};

      map[iX].push(tile);
    }
    iX++;
  }

  //add biomes

  for (let x = 0; x < map.length; x++) {
    for (let y = 0; y < map[0].length; y++) {
      map[x][y].height = lerp(this.settings.noise.minNoiseHeight, this.settings.noise.maxNoiseHeight, map[x][y].height);
      // console.log(map[x][y].height);
      var b = biome(map[x][y].height, this.settings.biomes);
      map[x][y].biome = b[0];
      map[x][y].biomeColor = b[1];

      //Create city
      // if (map[x][y].biome != "OCEAN" && math.random(0, 1) < 0.0002) {
      //   this.hasCity = true;
      // }

      // if (tile.hasCity) {
      //   tile.peopleCount = 100;
      //   this.cities.push(new City(x, y, 100, cityIndex));
      //   cityIndex++;
      //   tile.peopleCount = 1;
      // }
    }
  }

  // console.log("Generating city navigation for " + this.cities.length + " cities...");
  // //generate nodes for each city
  // for (let x = 0; x < this.width; x++) {
  //   for (let y = 0; y < this.height; y++) {
  //     for (let i = 0; i < this.cities.length; i++) {
  //       map[x][y].navigation[i.toString()] = new Node(i, x, y);
  //       map[x][y].navigation[i.toString()].hCost = distanceCost(this.cities[i].position, createVector(x, y));
  //     }
  //   }
  // }

  // console.log("Sorting cities")
  // for (let i = 0; i < this.cities.length; i++) {
  //   this.cities[i].nearCities = this.cities.slice();
  //   for (let a = 0; a < this.cities[i].nearCities.length; a++) {
  //     let city = this.cities[i].nearCities[a];
  //     city.dist = distanceCost(this.cities[i].position, city.position);
  //   }
  //   this.cities[i].nearCities.sort(function (a, b) {
  //     return a.dist - b.dist;
  //   });
  //   this.cities[i].nearCities.splice(0, 1);
  // }
  console.log("Done!")
  mapgen = this;
  return new Promise(function (resolve, reject) {
    //
    console.log('saving map to file');
    mapgen.saveMap().then(() => {
      resolve();
    }
    ).catch((err) => {
      reject(err);
    });
  })

}

Map.prototype.generateMapChunk = function (name, topX, topY, width, height, scale, generate) {

  map = [];
  var simplex = new SimplexNoise(this.settings.noise.seed);
  console.log(`Generating map chunk ${name}`);

  let iX = 0;
  for (let x = topX; x < topX + width * scale; x += scale) {
    map.push([]);
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
      let b = biome(map[iX][iY].height, this.settings.biomes);
      map[iX][iY].biome = b[0];
      map[iX][iY].biomeColor = b[1];
      //generate entities
      if (generate) {
        // console.log(`should start generating`);
        for (let i = 0; i < this.vegetationSettings.length; i++) {
          const vegSettings = this.vegetationSettings[i];
          for (let b = 0; b < vegSettings.spawnSettings.biomes.length; b++) {
            const biome = vegSettings.spawnSettings.biomes[b];
            if (biome.name == map[iX][iY].biome) {
              //console.log("biome name match");
              let num = Math.random();
              //awconsole.log(`chance ${num}/${biome.chance}`)
              if (num < biome.chance) {
                //console.log(`spawn ${vegSettings.name}`);
                //pick sprite
                let v = Math.floor(Math.random() * vegSettings.baseSprites.length);
                // const sprite = vegSettings.baseSprites[v];
                //spawn watever vegetation is needed
                let entity = new Vegetation(vegSettings.name, this.id++, x, y, i, v);
                this.vegetation.push(entity);
                this.map[`x:${x},y:${y}`] = {
                  biome: b[0],
                  height: map[iX][iY].height,
                  vegIndex: this.vegetation.length - 1
                };
              }
            }

          }
        }
      }
      iY++;
    }
    iX++;
  }

  mapgen = this;
  return new Promise(function (resolve, reject) {
    //save json data of chunk
    let chunkData = {
      name: name,
      topX: topX,
      topY: topY,
      width: width,
      height: height,
      scale: scale,
      url: `/static/map/${name}.png`
    }
    mapgen.saveMapChunk(name, width, height, map).then(() => {
      mapgen.chunkData[chunkData.name] = chunkData;
      console.log(`chunk data for ${chunkData.name} saved`);
      resolve(chunkData);
    }
    ).catch((err) => {
      reject(err);
    });
  })

}

Map.prototype.getHeight = function (x, y) {
  var simplex = new SimplexNoise(this.settings.noise.seed);

  let amplitude = 1;
  let frequency = 1;
  let noiseHeight = 0;
  for (let i = 0; i < this.settings.noise.octaves; i++) {
    let xOff = this.settings.noise.offsets[i][0];
    let yOff = this.settings.noise.offsets[i][1];
    let sampleX = xOff + x * this.settings.noise.scale * frequency;
    let sampleY = yOff + y * this.settings.noise.scale * frequency;
    let h = simplex.noise2D(sampleX, sampleY);
    noiseHeight += h * amplitude;
    amplitude *= this.settings.noise.persistence;
    frequency *= this.settings.noise.lacunarity;
  }
  return lerp(this.settings.noise.minNoiseHeight, this.settings.noise.maxNoiseHeight, noiseHeight);
}

Map.prototype.getBiome = function (x, y) {
  return biome(this.getHeight(x, y), this.settings.biomes);
}

Map.prototype.findNearestEntity = function(entityName, location, position) {
  let closestEntity;
  let closestDistance = 100000000000000000000000000000000000;

  for (let i in location) {
    let entity = location[i];
    let entityDistance = distanceCost(entity.position, position);
    if (!entity.destroy && entityDistance < closestDistance && entityName === entity.name){
      closestEntity = entity;
      closestDistance = entityDistance;
    }
  }
  return closestEntity;
}

Map.prototype.saveMap = function () {
  map = this;
  return new Promise(function (resolve, reject) {
    var image = PNGImage.createImage(map.width, map.height);
    let iX = 0;
    for (let x = - map.settings.width / 2 * map.settings.scale; x < map.settings.width / 2 * map.settings.scale; x += map.settings.scale) {
      let iY = 0;
      for (let y = - map.settings.height / 2 * map.settings.scale; y < map.settings.height / 2 * map.settings.scale; y += map.settings.scale) {
        let color = map.getBiome(x, y)[1];
        // console.log(`x: ${x}, y: ${y}, color: ${color}`);
        // Set a pixel at (20, 30) with red, having an alpha value of 100 (half-transparent)
        image.setAt(iX, iY, { red: color[0], green: color[1], blue: color[2], alpha: 255 });
        iY++;
      }
      iX++;
    }

    // // Get index of coordinate in the image buffer
    // var index = image.getIndex(20, 30);

    // // Print the red color value
    // console.log(image.getRed(index));

    // // Get low level image object with buffer from the 'pngjs' package
    // var pngjs = image.getImage();

    image.writeImage(`./static/map.png`, function (err) {
      if (err) {
        reject(err);
      } else {
        console.log('Written to the file');
        resolve()
      }
    });
  });

}

Map.prototype.saveMapChunk = function (name, width, height, map) {
  return new Promise(function (resolve, reject) {
    var image = PNGImage.createImage(width, height);
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[0].length; y++) {
        // console.log(`x: ${x}, y: ${y}, color: ${color}`);
        image.setAt(x, y, { red: map[x][y].biomeColor[0], green: map[x][y].biomeColor[1], blue: map[x][y].biomeColor[2], alpha: 255 });
      }
    }

    // // Get low level image object with buffer from the 'pngjs' package
    // var pngjs = image.getImage();

    image.writeImage(`./static/map/${name}.png`, function (err) {
      if (err) {
        console.log('something went wrong with the map chunkss saving');
        reject(err);
      } else {
        console.log('Written to the file');
        resolve();
      }
    });
  });

}

function biome(e, biomes) {
  var WATER = color(e * 100, e * 100, 255 * e + 100);
  var LAND = color(0, 255 * e, 0);
  let biomeName = 'null';
  for (let i = 0; i < biomes.length; i++) {
    const biome = biomes[i];
    //console.log(`biome info: ${JSON.stringify(biome)}`);
    if (e >= biome.minHeight && e < biome.maxHeight) {
      biomeName = biome.name;
      //console.log(`found biome match: ${biomeName}`);
    }
  }
  if (biomeName == 'water') return [biomeName, WATER];
  else if (biomeName == 'land') return [biomeName, LAND];
  else return ['unkown', [255, 192, 203]]
}

function color(r, g, b) {
  return [r, g, b];
}

function distanceCost(pos1, pos2) {
  xDist = math.abs(pos1.x - pos2.x);
  yDist = math.abs(pos1.y - pos2.y);
  sDist = math.abs(xDist - yDist);
  oDist = math.max(xDist, yDist) - sDist;

  return sDist * 10 + oDist * 14;
}

function lerp(min, max, num) {
  return (num - min) / (max - min);
}

module.exports = Map;