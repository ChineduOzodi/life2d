function Entity(name, id, x, y, settingsIndex, baseSpriteIndex) {
    this.name = name;
    this.position = createVector(x, y);
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
    this.id = id;
    this.reserved = false;
    this.destroy = false;
}

Entity.prototype.run = function (map, goap, deltaTime) {

}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;