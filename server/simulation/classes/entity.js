function Entity(x, y, settingsIndex, baseSpriteIndex) {
    this.position = createVector(x, y);
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;