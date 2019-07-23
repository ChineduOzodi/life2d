var Entity = require('./entity');

function Vegetation(name, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, name, 'vegetation', id, x, y, settingsIndex, baseSpriteIndex)
}

Vegetation.prototype = Object.create(Entity.prototype);

Vegetation.prototype.birth = function (map, traits) {
  // console.log(`spawning enity: ${this.name}`);
  // let startTime = Date.now();
  Object.getPrototypeOf(Vegetation.prototype).birth.call(this, map, traits);
  // console.log(`set traits (vegetation class): ${JSON.stringify(this.traits)}`);
  // console.log('calculate attrition');
  //calculate attrition
  this.calculateAttrition(map);

  //set health
  this.calculateHealth();

  // let runtime = Date.now() - startTime;
  // if (runtime > 10){
  //   console.log(`vegetation birth ${this.id} runtime: ${runtime} ms`);
  // }

  
}

Vegetation.prototype.death = function (map) {
  this.deathFunctionRun = true;
  if (this.nearestEntityId) {
    console.log(`attrition recalculated`);
    let nearestEntity = map.entities.find(x => x.id === this.nearestEntityId);
    if (nearestEntity) {
      nearestEntity.calculateAttrition(map);
    } else {
      console.log(`could not find nearest entity`);
    }
  }
}

Vegetation.prototype.run = function (map, goap) {
  // console.log(`running enity: ${this.name}`);
  // let startTime = Date.now();

  Object.getPrototypeOf(Vegetation.prototype).run.call(this, map, goap);
  if (!this.destroy) {
    this.applyRates(this.deltaTime);
    this.checkHealth();
    this.checkSpawnEntity(map);
    this.checkBerries(map);
  } else if (!this.deathFunctionRun) {
    this.death(map);
  }

  // let runtime = Date.now() - startTime;
  // if (runtime > 10){
  //   console.log(`vegetation ${this.id} runtime: ${runtime} ms`);
  // }
}

Vegetation.prototype.applyRates = function () {
  this.health -= this.healthLossRate * this.deltaTime;
  this.health = Math.max(this.health, 0);

  this.duplicate -= this.deltaTime;
  this.duplicate = Math.max(this.duplicate, 0);
  // console.log(`duplicate: ${this.duplicate}`);
}

Vegetation.prototype.checkHealth = function () {
  if (this.health === 0) {
    //death
    // console.log('death of vegetation');
    this.health = 0;
    this.destroy = true;
  }
}

Vegetation.prototype.removeBerries = function (map) {
  // console.log(`${this.id} berries removed`);
  this.noBerries = true;
  this.addBerriesTime = map.time + 60;
  this.health - 10;
  if (this.health < 0) {
    this.health = 0;
  }
}

Vegetation.prototype.checkBerries = function (map) {
  if (this.noBerries && this.addBerriesTime <= map.time) {
    // console.log(`${this.id} berries grown`);
    this.noBerries = false;
  }
}

Vegetation.prototype.checkSpawnEntity = function (map) {
  if (this.duplicate === 0) {
    // console.log('duplicating vegetation');
    const randomX = (Math.random() - 0.5) * 2 * this.attrition * 3;
    const randomY = (Math.random() - 0.5) * 2 * this.attrition * 3;

    const spawnX = this.position.x + randomX;
    const spawnY = this.position.y + randomY;
    if (map.withinBorder(spawnX, spawnY)) {
      const spawnBiome = map.getBiome(spawnX, spawnY)[0];

      //found biome match, can spawn entity
      if (this.spawnBiomes.find(x => x === spawnBiome)) {
        //create child traits
        let childTraits = this.createChildTraits();

        //create other needed things
        let spawnSettings = map.entitySettings.find(x => x.name === this.name);
        let baseSpriteIndex = Math.floor(Math.random() * spawnSettings.baseSprites.length);
        // console.log(`this bsi: ${this.baseSpriteIndex}, child bsi: ${baseSpriteIndex}`);
        let entity = new Vegetation(spawnSettings.name, map.id++, spawnX, spawnY, this.settingsIndex, baseSpriteIndex);
        entity.spawnBiomes = spawnSettings.spawnBiomes;
        entity.baseHealthLossRate = spawnSettings.baseHealthLossRate;
        entity.attrition = spawnSettings.attrition;
        entity.attritionHealthEffect = spawnSettings.attritionHealthEffect;
        entity.generation = this.generation + 1;
        entity.birth(map, childTraits);
        map.addNewEntity(entity);
      } else {
        // console.log(`biome ${spawnBiome} does not match accepted biomes`);
      }

      const trait = this.getTrait('duplicate');
      if (trait) {
        trait.amount = trait.base + (Math.random() - 0.5) * 2 * trait.randomness;
        this[trait.name] = trait.amount;
      } else {
        console.error(`could not find trait duplicate in entity: ` + JSON.stringify(this));
        this.duplicate = 1000;
      }
    }
  }
}

Vegetation.prototype.createChildTraits = function () {
  let childTraits = [];
  for (const trait of this.traits) {
    let childTrait = JSON.parse(JSON.stringify(trait));
    childTrait.base = childTrait.amount;
    childTraits.push(childTrait);
  }
  return childTraits;
}

Vegetation.prototype.calculateHealth = function () {
  const trait = this.getTrait('duplicate');
  if (trait) {
    this.health = trait.base * trait.healthMult;
    // console.log('health calculated: ' + this.health);
  } else {
    console.log(`could not find trait duplicate`);
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