function Entity(id, x, y, settingsIndex, baseSpriteIndex) {
    this.position = createVector(x, y);
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
    this.id = id;
    this.reserved = false;
}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;