var Entity = require('./entity');

function Vegetation(name, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, name, 'vegetation', id, x, y, settingsIndex, baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);

Vegetation.prototype.birth = function (map, traits) {
  // console.log(`spawning enity: ${this.name}`);
  Object.getPrototypeOf(Vegetation.prototype).birth(map, traits);

  // console.log('calculate attrition');
  //calculate attrition
  this.calculateAttrition(map);

  //set health
  this.calculateHealth();
}

Vegetation.prototype.run = function (map, goap, deltaTime) {
  // console.log(`running enity: ${this.name}`);
  Object.getPrototypeOf(Vegetation.prototype).run(map, goap, deltaTime);
  this.applyRates(deltaTime);
  this.updateDuplicate(deltaTime);
  this.checkSpawnEntity(map);
}

Vegetation.prototype.applyRates = function (deltaTime) {
  this.health -= this.healthLossRate * deltaTime;
  this.health = Math.max(this.health, 0);
}

Vegetation.prototype.updateDuplicate = function (deltaTime) {
  this.duplicate -= deltaTime;
  this.duplicate = Math.max(this.duplicate, 0);
  // console.log(`duplicate: ${this.duplicate}`);

}

Vegetation.prototype.checkSpawnEntity = function (map) {
  if (this.duplicate === 0) {
    console.log('duplicating vegetation');
    const randomX = (Math.random() - 0.5 * 2) * this.attrition * 3;
    const randomY = (Math.random() - 0.5 * 2) * this.attrition * 3;

    const spawnX = this.position.x + randomX;
    const spawnY = this.position.y + randomY;

    const spawnBiome = map.getBiome(spawnX, spawnY)[0];


    if (this.spawnBiomes.find(x => x === spawnBiome)) {
      //found biome match, can spawn entity
      console.log(`found biome match`);
    } else {
      console.log(`biome ${spawnBiome} does not match accepted biomes`);
    }

    const trait = this.getTrait('duplicate');
    if (trait) {
      trait.amount = trait.base + (Math.random() - 0.5) * 2 * trait.randomness;
      this[trait.name] = trait.amount;
    } else {
      console.error(`could not find trait duplicate in entity`);
      this.duplicate = 1000;
    }
  }
}

Vegetation.prototype.calculateAttrition = function (map) {
  const nearestEntity = map.findNearestEntityName(this.name, this);

  if (nearestEntity) {
    console.log(`found nearest entity`);
    const distCost = distanceCost(this.position, nearestEntity.position) / 10.0;
    if (distCost === 0) {
      console.log('distance equals 0');
      distCost = 0.1;
    }
    const attrition = this.attrition / distCost;
    if (attrition > 1) {
      this.healthLossRate = this.baseHealthLossRate + (attrition - 1) * attritionHealthEffect;
    }
  }
}

Vegetation.prototype.calculateHealth = function () {
  console.log('health calculated');
  const trait = this.getTrait('duplicate')
  if (trait) {
    this.health = trait.base * trait.healthMult;

  }
}

function distanceCost(pos1, pos2) {
  xDist = math.abs(pos1.x - pos2.x);
  yDist = math.abs(pos1.y - pos2.y);
  sDist = math.abs(xDist - yDist);
  oDist = math.max(xDist, yDist) - sDist;

  return sDist * 10 + oDist * 14;
}

module.exports = Vegetation;