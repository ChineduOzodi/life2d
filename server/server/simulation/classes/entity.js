function Entity(name, type, id, x, y, settingsIndex, baseSpriteIndex) {
    this.type = type;
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