function Entity(name, type, id, x, y, settingsIndex, baseSpriteIndex) {
    this.type = type;
    this.name = name;
    this.age = 0;
    this.position = createVector(x, y);
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
    this.id = id;
    this.traits = [];
    this.reserved = false;
    this.destroy = false;
}

Entity.prototype.run = function (map, goap, deltaTime) {
  // console.log(`running enity: ${this.name}`);
  if (!this.destroy) {
    this.age += deltaTime;
  }
}

Entity.prototype.birth = function(map, traits) {
  // console.log(`traits: ${JSON.stringify(traits)}`);
  this.traits = [];
  for (let trait of traits) {
    trait.amount = trait.base + (Math.random() - 0.5) * 2 * trait.randomness;
    this.traits.push(trait);
    this[trait.name] = trait.amount;
  }
}

Entity.prototype.getTrait = function(name) {
  this.traits.find( x => x.name === name);
}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;