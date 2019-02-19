var Tile = require('./tile');
var City = require('./city');
var Node = require('./node');
var math = require('mathjs');
var SimplexNoise = require('simplex-noise');
var PNGImage = require('pngjs-image');

function Map(width, height, tileSize) {
  this.width = width;
  this.height = height;
  this.tileSize = tileSize;
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

Map.prototype.generateMap = function () {

  this.cities = [];
    map = [];
    var radius = 50;
    this.offsets = [];
    this.scale = 0.005;
    this.octaves = 8;
    this.minNoiseHeight = 1000000000000000000000000000;
    this.maxNoiseHeight = 0.000000000000000000000000001;
    this.persistence = 0.5; // 0 to 1
    this.lacunarity = 2; //greater than 1
    var redist = 1;
    var cityIndex = 0;
    this.seed = math.random(0,100).toString();
    var simplex = new SimplexNoise(this.seed);
    console.log("Generating map...");

    //create offsets
    for (let i = 0; i < this.octaves; i++) {
      this.offsets.push([math.random(-100000, 100000), math.random(-100000, 100000)]);
    }

    for (let x = 0; x < this.width; x++) {
      map.push([]);
      for (let y = 0; y < this.height; y++) {
        let amplitude = 1;
        let frequency = 1;
        let noiseHeight = 0;
        for (let i = 0; i < this.octaves; i++) {
          let xOff = this.offsets[i][0];
          let yOff = this.offsets[i][1];
          let sampleX = xOff + x * this.scale * frequency;
          let sampleY = yOff + y * this.scale * frequency;
          let h = simplex.noise2D(sampleX, sampleY);
          noiseHeight += h * amplitude;
          amplitude *= this.persistence;
          frequency *= this.lacunarity;
        }
        //var index = (x + y * width) * 4;

        //console.log(noiseHeight);
        if (noiseHeight > this.maxNoiseHeight) {
          this.maxNoiseHeight = noiseHeight;
        } else if (noiseHeight < this.minNoiseHeight) {
          this.minNoiseHeight = noiseHeight;
        }
        //console.log(b);
        var tile = new Tile(x, y, this.tileSize, noiseHeight);

        map[x].push(tile);
      }
    }

    //add biomes

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        map[x][y].height = lerp(this.minNoiseHeight, this.maxNoiseHeight, map[x][y].height);
        // console.log(map[x][y].height);
        var b = biome(map[x][y].height);
        map[x][y].biome = b[0];
        map[x][y].biomeColor = b[1];

        //Create city
        if (map[x][y].biome != "OCEAN" && math.random(0, 1) < 0.0002) {
          this.hasCity = true;
        }

        if (tile.hasCity) {
          tile.peopleCount = 100;
          this.cities.push(new City(x, y, 100, cityIndex));
          cityIndex++;
          tile.peopleCount = 1;
        }
      }
    }

    console.log("Generating city navigation for " + this.cities.length + " cities...");
    //generate nodes for each city
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let i = 0; i < this.cities.length; i++) {
          map[x][y].navigation[i.toString()] = new Node(i, x, y);
          map[x][y].navigation[i.toString()].hCost = distanceCost(this.cities[i].position, createVector(x, y));
        }
      }
    }

    console.log("Sorting cities")
    for (let i = 0; i < this.cities.length; i++) {
      this.cities[i].nearCities = this.cities.slice();
      for (let a = 0; a < this.cities[i].nearCities.length; a++) {
        let city = this.cities[i].nearCities[a];
        city.dist = distanceCost(this.cities[i].position, city.position);
      }
      this.cities[i].nearCities.sort(function (a, b) {
        return a.dist - b.dist;
      });
      this.cities[i].nearCities.splice(0, 1);
    }
    console.log("Done!")
    this.map = map;
    mapgen = this;
  return new Promise(function (resolve, reject) {
    //
    console.log('saving map to file');
    mapgen.saveMap().then( () => {
      resolve();
    }
    ).catch( (err) => {
      reject(err);
    });
  })

}

Map.prototype.getHeight = function (x, y) {
  var simplex = new SimplexNoise(this.seed);

  let amplitude = 1;
  let frequency = 1;
  let noiseHeight = 0;
  for (let i = 0; i < this.octaves; i++) {
    let xOff = this.offsets[i][0];
    let yOff = this.offsets[i][1];
    let sampleX = xOff + x * this.scale * frequency;
    let sampleY = yOff + y * this.scale * frequency;
    let h = simplex.noise2D(sampleX, sampleY);
    noiseHeight += h * amplitude;
    amplitude *= this.persistence;
    frequency *= this.lacunarity;
  }
  return lerp(this.minNoiseHeight, this.maxNoiseHeight, noiseHeight);
}

Map.prototype.getBiomeColor = function (x, y) {
  return biome(this.getHeight(x, y))[1];
}

Map.prototype.saveMap = function () {
  map = this;
  return new Promise(function (resolve, reject) {
    var image = PNGImage.createImage(map.width, map.height);

    for (var x = 0; x < map.width; x++) {
      for (var y = 0; y < map.height; y++) {
        let color = map.getBiomeColor(x, y);
        // Set a pixel at (20, 30) with red, having an alpha value of 100 (half-transparent)
        image.setAt(x, y, { red: color[0], green: color[1], blue: color[2], alpha: 255 });

      }
    }

    // // Get index of coordinate in the image buffer
    // var index = image.getIndex(20, 30);

    // // Print the red color value
    // console.log(image.getRed(index));

    // // Get low level image object with buffer from the 'pngjs' package
    // var pngjs = image.getImage();

    image.writeImage('./static/map.png', function (err) {
      if (err){
        reject(err);
      }else{
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