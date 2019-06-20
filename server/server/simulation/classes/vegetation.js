var Entity = require('./entity');

function Vegetation(name, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, name, 'vegetation', id, x, y, settingsIndex, baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);

module.exports = Vegetation;