function Entity(name, type, id, x, y, settingsIndex, baseSpriteIndex) {
    this.type = type;
    this.name = name;
    this.age = 0;
    this.position = createVector(x, y);
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
    this.id = id;
    this.reserved = false;
    this.isReserved = false;
    this.destroy = false;
    this.lastUpdateTime = 0;
    this.deltaTime = 1;
    this.tags = [];
}

Entity.prototype.addTag = function (tag) {
  if (!this.hasTag(tag)) {
    this.tags.add(tag);
  }
}

Entity.prototype.hasTag = function (tag) {
  return this.tags.find(x => x === tag);
}

Entity.prototype.run = function (map, goapPlanner) {
  this.deltaTime = map.time - this.lastUpdateTime;
  this.lastUpdateTime = map.time;
  // console.log(`running enity: ${this.name}`);
  if (!this.destroy) {
    this.age += this.deltaTime;
  }
}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;