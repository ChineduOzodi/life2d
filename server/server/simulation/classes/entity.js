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