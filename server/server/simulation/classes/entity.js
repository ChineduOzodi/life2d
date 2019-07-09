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
    this.isReserved = false;
    this.destroy = false;
    this.lastUpdateTime = 0;
    this.deltaTime = 1;
}

Entity.prototype.run = function (map, goapPlanner) {
  this.deltaTime = map.time - this.lastUpdateTime;
  this.lastUpdateTime = map.time;
  // console.log(`running enity: ${this.name}`);
  if (!this.destroy) {
    this.age += this.deltaTime;
  }
}

Entity.prototype.birth = function(map, traits) {
  // console.log(`traits (entity class): ${JSON.stringify(traits)}`);
  this.lastUpdateTime = map.time;
  this.traits = [];
  for (let trait of traits) {
    let traitCopy = JSON.parse(JSON.stringify(trait));
    traitCopy.amount = trait.base + (Math.random() - 0.5) * 2 * trait.randomness;
    if (traitCopy.amount < 0.1){
      traitCopy.amount = 0.1;
    }
    this.traits.push(traitCopy);
    this[trait.name] = traitCopy.amount;
  }
  // console.log(`set traits: ${JSON.stringify(this.traits)}`);
}

Entity.prototype.getTrait = function(name) {
  // console.log(`finding name (${name}) in traits: ${JSON.stringify(this.traits)}`);
  return this.traits.find( x => x.name === name);
}

function createVector(x,y) {
    return {x:x,y:y};
  }

module.exports = Entity;