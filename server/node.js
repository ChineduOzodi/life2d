function Node(cityIndex, x, y) {
  this.id = `city:${cityIndex}x:${x}y:${y}`;
  this.position = createVector(x,y);
  this.cityIndex = cityIndex;
  this.gCost = 0;
  this.hCost = 0;
  this.distance = 0;
  this.direction = createVector(0,0);
  this.connects = false;
}

Node.prototype.fCost = function(targetCityIndex) {
  var tile = map.map[this.position.x][this.position.y];
  var tNode = tile.navigation[targetCityIndex];
  return tNode.hCost + this.hCost;
}

module.exports = Node;