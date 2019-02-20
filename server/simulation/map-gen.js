var Tile = require('./tile');
var City = require('./city');
var Node = require('./node');
var math = require('mathjs');
var SimplexNoise = require('simplex-noise');
var PNGImage = require('pngjs-image');
var fs = require("fs");

function Map(settings) {
  this.name = settings.name;
  this.width = settings.width;
  this.height = settings.height;
  this.tileSize = settings.scale;
  this.settings = settings;
  this.cities = [];
  this.map = null;
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

Map.prototype.randomMap = function () {

  //console.log(`OFFSETS: ${this.settings.noise.offsets}`);
  //create offsets
  if (this.settings.noise.randomSeed) {
    console.log("Generating new map...");
    this.settings.noise.seed = math.random(0, 100);
    this.settings.noise.offsets = [];
    for (let i = 0; i < this.settings.noise.octaves; i++) {
      this.settings.noise.offsets.push([math.random(-100000, 100000), math.random(-100000, 100000)]);
    }
    //console.log(`OFFSETS: ${this.settings.noise.offsets}`);
    this.generateMap().then( () => {
      //save settings
      console.log('saving to file');
      fs.writeFileSync('./server/settings/mapgen.json', JSON.stringify(this.settings));
      console.log('finished saving settings to file');
    });
  } else {
    console.log('no new map generation, settings.noise.randomSeed not set to true');
  }
}

Map.prototype.generateMap = function () {

  this.cities = [];
  map = [];
  var cityIndex = 0;
  var simplex = new SimplexNoise();
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
      var b = biome(map[x][y].height);
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
  return biome(this.getHeight(x, y))[1];
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

    image.writeImage('./static/map.png', function (err) {
      if (err) {
        reject(err);
      } else {
        console.log('Written to the file');
        resolve()
      }
    });
  });

}

function biome(e) {
  var waterlevel = 0.5;
  var WATER = color(e * 100, e * 100, 255 * e + 100);
  var LAND = color(0, 255 * e, 0);
  if (e < waterlevel) return ["OCEAN", WATER];
  else return ["LAND", LAND];
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