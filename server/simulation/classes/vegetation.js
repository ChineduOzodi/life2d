var Entity = require('./entity');

function Vegetation(x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this,x,y,settingsIndex,baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);

module.exports = Vegetation;