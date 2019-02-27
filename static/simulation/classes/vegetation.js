function Vegetation(id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, id, x, y, settingsIndex, baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);