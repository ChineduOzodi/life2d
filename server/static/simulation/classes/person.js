function Person(id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, id, x, y, settingsIndex, baseSpriteIndex)
}

Person.prototype = Object.create(Entity.prototype);