var Tile = require('./tile');
var City = require('./city');
var Node = require('./node');
var math = require('mathjs');
var SimplexNoise = require('simplex-noise');
var PNGImage = require('pngjs-image');
var fs = require("fs");

function Map(settings, saveData) {
  this.name = settings.name;
  this.width = settings.width;
  this.height = settings.height;
  this.tileSize = settings.scale;
  this.settings = settings;
  this.cities = [];
  this.map = null;
  this.vegetation = saveData.vegetation;
  this.vegetationSettings = [];
}

Map.prototype.saveData = function(location) {
  new Promise( (resolve,reject) =>{
    let data = {
      vegetation: this.vegetation
    }
    fs.writeFile(location, JSON.stringify(data),(err) => {
      if (err) {
        console.log(`could not save map data`);
        reject(err);
      }else{
        console.log('sim saved');
        resolve();
      }
    });
  })
}

Map.prototype.run = function () {
  for (var i = 0; i < this.cities.length; i++) {
    this.cities[i].run(this);
  }
  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      this.map[x][y].run(this);
    }
  }
}

Map.prototype.render = function () {
  render = [];
  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      if (this.map[x][y].stateChanged) {
        render.push(this.map[x][y].render());
      }
    }
  }
  return render;
}

Map.prototype.renderAll = function () {
  render = [];
  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      render.push(this.map[x][y].render(true));
    }
  }
  return render;
}

Map.prototype.setMap = function (chunkManifest,savePath) {
  if (this.settings.regenerate == true) {
    this.vegetation = [];
    if (this.settings.randomSeed == true) {
      this.settings.seed = math.random(0, 100);
      console.log(`created new random seed for map`);
    }

    this.randomMap(chunkManifest).then(() => {
      console.log('saving to file');
      fs.writeFileSync('./server/settings/mapgen.json', JSON.stringify(thisMap.settings));
      console.log('finished saving settings to file');
      this.saveData(savePath);
    });
  }else{

  }
}

Map.prototype.randomMap = function (chunkManifest) {

  thisMap = this;
  return new Promise((resolve, reject) => {
    //console.log(`OFFSETS: ${thisMap.settings.noise.offsets}`);
    //create offsets
    if (thisMap.settings.noise.randomSeed) {
      console.log('deleting old chunk data');
      for (let i = 0; i < chunkManifest.chunkNames.length; i++) {
        const chunkName = chunkManifest.chunkNames[i];
        fs.unlink(`./server/simulation/map/${chunkName}.json`, (err) => {
          if (err) {
            console.log('error removing chunk json');
            console.log(err);
          }
        });
        fs.unlink(`./static/map/${chunkName}.png`, (err) => {
          if (err) {
            console.log('error removing chunk png');
            console.log(err);
          }
        });
      }
      chunkManifest.chunkNames = [];
      fs.writeFileSync(`./server/simulation/map/manifest.json`, JSON.stringify(chunkManifest));
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
      });
    } else {
      console.log('no new map generation, settings.noise.randomSeed not set to true');
      resolve();
    }
  })

}

Map.prototype.generateMap = function () {

  this.cities = [];
  map = [];
  var cityIndex = 0;
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
      var tile = new Tile(x, y, this.settings.noise.tileSize, noiseHeight);

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
  //this.map = map;
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
      var b = biome(map[iX][iY].height,this.settings.biomes);
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
              if ( num < biome.chance) {
                //console.log(`spawn ${vegSettings.name}`);
                //pick sprite
                let v = Math.floor(Math.random() * vegSettings.baseSprites.length);
                // const sprite = vegSettings.baseSprites[v];
                //spawn watever vegetation is needed
                this.vegetation.push({
                  name:vegSettings.name,
                  x:x,
                  y:y,
                  vegSettingsIndex:i,
                  baseSpriteIndex:v
                })
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
    console.log('saving map chunk to file');
    //save json data of chunk
    let chunkData = {
      name: name,
      topX: topX,
      topY: topY,
      width: width,
      height: height,
      scale: scale,
      url: `./static/map/${name}.png`
    }
    mapgen.saveMapChunk(name, width, height, map).then(() => {
      fs.writeFileSync(`./server/simulation/map/${name}.json`, JSON.stringify(chunkData));
      console.log("Done writing json");
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

Map.prototype.getBiomeColor = function (x, y) {
  return biome(this.getHeight(x, y),this.settings.biomes)[1];
}

Map.prototype.saveMap = function () {
  map = this;
  return new Promise(function (resolve, reject) {
    var image = PNGImage.createImage(map.width, map.height);
    let iX = 0;
    for (let x = - map.settings.width / 2 * map.settings.scale; x < map.settings.width / 2 * map.settings.scale; x += map.settings.scale) {
      let iY = 0;
      for (let y = - map.settings.height / 2 * map.settings.scale; y < map.settings.height / 2 * map.settings.scale; y += map.settings.scale) {
        let color = map.getBiomeColor(x, y);
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
    let iX = 0;
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

function biome(e,biomes) {
  var WATER = color(e * 100, e * 100, 255 * e + 100);
  var LAND = color(0, 255 * e, 0);
  let biomeName = 'null';
  for (let i = 0; i < biomes.length; i++) {
    const biome = biomes[i];
    //console.log(`biome info: ${JSON.stringify(biome)}`);
    if (e >= biome.minHeight && e < biome.maxHeight ){
      biomeName = biome.name;
      //console.log(`found biome match: ${biomeName}`);
    }
  }
  if (biomeName == 'water') return [biomeName, WATER];
  else if (biomeName == 'land') return [biomeName, LAND];
  else return ['unkown',[255,192,203]]
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

function createVector(x, y) {
  return { x: x, y: y };
}

function lerp(min, max, num) {
  return (num - min) / (max - min);
}

module.exports = Map;