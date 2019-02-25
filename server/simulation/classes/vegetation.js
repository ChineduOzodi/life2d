var Entity = require('./entity');

function Vegetation(entity, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, entity, id, x, y, settingsIndex, baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);

module.exports = Vegetation;