function Vegetation(x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this,x,y,settingsIndex,baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);