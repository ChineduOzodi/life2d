var Tile = require('./tile');
var City = require('./city');
var Node = require('./node');
var math = require('mathjs');

function Map(mapWidth, mapHeight, tileSize) {
  this.width = mapWidth;
  this.height = mapHeight;
  this.tileSize = tileSize;
  this.cities = [];
  this.map = this.generateMap(mapWidth, mapHeight, tileSize);

}

Map.prototype.run = function() {
  for (var i = 0; i < this.cities.length; i++) {
    this.cities[i].run(this);
  }
  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      this.map[x][y].run(this);
    }
  }
}

Map.prototype.generateMap = function(mapWidth, mapHeight, tileSize) {
  angleMode(RADIANS);
  noiseDetail(8, 0.5);
  //noiseSeed(1);
  map = [];
  var cities = [];
  var radius = 50;
  var xOff = 0;
  var yOff = 0;
  var scale = 0.02;
  var redist = 2;
  var cityIndex = 0;
  print("Generating map...");
  for (let x = 0; x < mapWidth; x++) {
    map.push([]);
    for (let y = 0; y < mapHeight; y++) {
      //var index = (x + y * width) * 4;      
      var simplex = new SimplexNoise();
      var r = simplex.noise2D((xOff + x) * scale, (yOff + y) * scale) - 0.5;
      r = math.pow(r + 0.5, redist);
      var b = biome(r);
      var tile = new Tile(x, y, tileSize, b[0], b[1]);
      tile.height = r;
      if (tile.hasCity) {
        tile.peopleCount = 100;
        this.cities.push(new City(x, y, 100, cityIndex));
        cityIndex++;
        tile.peopleCount = 1;
      }
      map[x].push(tile);
    }
  }
  print("Generating city navigation for " + this.cities.length + " cities...");
  //generate nodes for each city
  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      for (let i = 0; i < this.cities.length; i++) {
        map[x][y].navigation[i.toString()] = new Node(i, x, y);
        map[x][y].navigation[i.toString()].hCost = distanceCost(this.cities[i].position, createVector(x, y));
      }
    }
  }
	print("Sorting cities")
  for (let i = 0; i < this.cities.length; i++) {
    this.cities[i].nearCities = this.cities.slice();
    for (let a = 0; a < this.cities[i].nearCities.length; a++) {
      let city = this.cities[i].nearCities[a];
      city.dist = distanceCost(this.cities[i].position, city.position);
    }
    this.cities[i].nearCities.sort(function(a, b) {
      return a.dist - b.dist;
    });
    this.cities[i].nearCities.splice(0,1);
  }
  print("Done!")
  return map;
}

function biome(e) {
  var waterlevel = 0.3;
  var WATER = color(0, 0, 255 * e + 150);
  var LAND = color(0, 255 * e, 0);
  if (e < waterlevel) return ["OCEAN", WATER];
  else return ["LAND", LAND];
}

function color(r,g,b,a) {
  return [r,g,b,a];
}

function distanceCost(pos1,pos2) {
  xDist = math.abs(pos1.x - pos2.x);
  yDist = math.abs(pos1.y - pos2.y);
  sDist = math.abs(xDist - yDist);
  oDist = math.max(xDist,yDist) - sDist;
  
  return sDist * 10 + oDist * 14;
}

module.exports = Map;