function Node(x, y, map, gCost, hCost, parent) {
  // this.id = `city:${cityIndex}x:${x}y:${y}`;
  this.position = {x:x,y:y};
  this.gCost = gCost;
  this.hCost = hCost;
  this.biome = map.getBiome(x,y);
  this.parent = parent;
}

Node.prototype.fCost = function() {
  return this.gCost + this.hCost;
}

module.exports = Node;