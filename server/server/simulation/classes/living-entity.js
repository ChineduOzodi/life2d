var Entity = require('./entity');

function LivingEntity(name, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, name, 'living-entity', id, x, y, settingsIndex, baseSpriteIndex);
  this.goals = [];
  this.actionPlan = [];
  this.currentAction = idleState;
  this.energy = 0;
  this.maxEnergy = 0;
  this.energyGainRate = 0;
  this.energyLossRate = 0;
  this.baseMaxEnergy = 0; // received from settings
  this.baseEnergyGainRate = 0; // receieved from settings
  this.baseEnergyLossRate = 0; // receieved from settings
  this.traits = [];
  this.modifiers = [];
  this.body - {};
  this.isSleeping = false;
}

LivingEntity.prototype = Object.create(Entity.prototype);

LivingEntity.prototype.birth = function (map, traits) {
  // let startTime = Date.now();
  // console.log(`spawning enity: ${this.name}`);
  this.lastUpdateTime = map.time;
  
  // console.log(`set traits: ${JSON.stringify(this.traits)}`);
  this.setTraits();
  this.setTags();
  if (this.attrition) {
    this.calculateAttrition(map);
  }
  if (this.speed) {
    this.calculateSpeed();
  }
  // let runtime = Date.now() - startTime;
  // if (runtime > 10) {
  //   console.log(`moving-entity birth ${this.id} runtime: ${runtime} ms`);
  // }
}

LivingEntity.prototype.setTags = function() {
  if (this.traitExpressed('mouth') && this.traitExpressed('herbivoreTeeth') && this.traitExpressed('stomach')) {
    this.addTag('herbivore');
  }
  if ((this.traitExpressed('mouth') && this.traitExpressed('lungs')) || this.traitExpressed('leaves')) {
    this.addTag('survies on land');
  }
  if (this.traitExpressed('eyes')) {
    this.addTag('sight');
  }
  if (this.traitExpressed('roots')) {
    this.addTag('roots');
  } else if (this.traitExpressed('legs')) {
    this.addTag('can move');
  }
  //TODO: check for whether energyGainRate is higher than energyLossRate
  let gender = this.getTrait('gender');
  if (gender) {
    this.addTag(gender.map[this.gender]);
  }
}

LivingEntity.prototype.setTraits = function() {
  this.traits = [];
  for (let trait of traits) {
    let traitCopy = JSON.parse(JSON.stringify(trait));
    this.configureTrait(traitCopy);
  }
}

LivingEntity.prototype.configureTrait = function(trait) {
  if (!this.body[trait.name]) {
    this.body[trait.name] = {};
    if (trait.count) {
      this.body[trait.name].count = trait.count;
    }
    if (trait.attachedTo) {
      this.body[trait.name].count = this.body[trait.attachedTo].count * this.body[trait.name].count
    }
  }
  switch (trait.geneType) {
    case "numerical":
      this.calculateTraitEffects(trait);
      break;
    case "item":
      this.calculateTraitEffects(trait);
      this.addTag(`Generates Items`);
      break;
    case "boolean":
      if (trait.effects) {
        this.calculateTraitEffects(trait);
      }
      break;
      case "allele":
          let definitionIndex = Math.floor(Math.random() * trait.definition.length);
          this[trait.name] = trait.definition[definitionIndex];
          break;
    default:
      console.error(`genetype ${trait.geneType} not recognized`);
      break;
  }
  this.traits.push(trait);
}

LivingEntity.prototype.calculateTraitEffects = function (trait) {
  let random = (Math.random() - 0.5) * 2 * trait.effectsRandomness;
  for (let effect of trait.effects) {
    effect.amount = effect.base + random;
    if (effect.amount < 0.1) {
      effect.amount = 0.1;
    }
    this.addTraitAmount(effect.name, effect.amount * this.body[trait.attachedTo].count * this.size);
  }
}

LivingEntity.prototype.addTraitAmount = function (name, amount) {
  if (!this[name]) {
    this[name] = 0;
  }
  this[name] += amount;
}
LivingEntity.prototype.traitExpressed = function (name) {
  // console.log(`finding name (${name}) in traits: ${JSON.stringify(this.traits)}`);
  return this.body[name].count > 0;
}
LivingEntity.prototype.getTrait = function (name) {
  // console.log(`finding name (${name}) in traits: ${JSON.stringify(this.traits)}`);
  return this.traits.find(x => x.name === name);
}

LivingEntity.prototype.death = function (map) {
  this.deathFunctionRun = true;
}

LivingEntity.prototype.run = function (map, goapPlanner, aStar) {
  // console.log(`running enity: ${this.name}`);
  // let startTime = Date.now();
  Object.getPrototypeOf(LivingEntity.prototype).run.call(this, map, goapPlanner);
  if (!this.destroy) {
    this.resetBaseAttributes();
    this.applyModifiers();
    this.applyBaseRates();
    this.currentAction(this, map, goapPlanner, aStar);
    this.checkHealth();
    this.checkSpawnEntity(map);
  } else if (!this.deathFunctionRun) {
    this.death(map);
  }
  // let runtime = Date.now() - startTime;
  // if (runtime > 10) {
  //   console.log(`moving-entity ${this.id} runtime: ${runtime} ms`);
  // }
  // console.log(`energy: ${this.energy}`);
}

LivingEntity.prototype.calculateSpeed = function () {
  this.speed /= this.size;
}

LivingEntity.prototype.calculateAttrition = function (map) {
  // const nearestEntity = map.findNearestEntityName(this.name, this);
  for (const entity of map.entities) {
    if (entity.name === this.name && !entity.destroy) {
      // console.log(`found nearest entity`);
      // this.nearestEntityId = nearestEntity.id;
      let distCost = distanceCost(this.position, entity.position) / 10.0;
      if (distCost === 0) {
        console.log('distance equals 0');
        distCost = 0.1;
      }
      const attrition = this.attrition / distCost;
      if (attrition > 1) {
        this.energyLossRate += (attrition - 1) * this.attritionEffect;
        // nearestEntity.healthLossRate = this.healthLossRate;
        // console.log(`attrition applied: ${this.healthLossRate}`);
      }
    }
  }
  
  // console.log(`health loss rate: ${this.healthLossRate}`);
}

LivingEntity.prototype.checkHealth = function () {
  if (this.health === 0 || this.energy === 0) {
    //death
    // console.log('death of vegetation');
    this.destroy = true;
  }
}

LivingEntity.prototype.resetBaseAttributes = function () {
  this.maxEnergy = this.baseMaxEnergy;
  this.energyGainRate = this.baseEnergyGainRate;
  this.energyLossRate = this.baseEnergyLossRate;
}

LivingEntity.prototype.addToBaseStat = function (statName, amount) {
  statName = camelize(statName);
  this[statName] += amount;
  let maxName = camelize(`max ${statName}`);
  console.log(`statName: ${statName}, amount: ${this[statName]}, addAmount: ${amount} maxName: ${maxName} maxAmount: ${this[maxName]}`);
  this[statName] = Math.min(this[maxName], this[statName]);
  this[statName] = Math.max(0, this[statName]);
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

LivingEntity.prototype.applyBaseRates = function () {
  if (this.isSleeping) {
    // this.energy += this.energyGainRate * this.deltaTime;
    // this.energy = Math.min(this.energy, this.maxEnergy);
  } else {
    this.energy -= this.energyLossRate * this.deltaTime;
    this.energy = Math.max(this.energy, 0);
    this.health -= this.healthLossRate * this.deltaTime;
    this.health = Math.max(this.health, 0);
    this.duplicate -= this.deltaTime;
    this.duplicate = Math.max(this.duplicate, 0);
  }

  if (this.fullness > 0) {
    if (this.isSleeping) {
      this.fullness -= this.hungerRate * this.deltaTime * 0.5;
    } else {
      this.fullness -= this.hungerRate * this.deltaTime;
    }
    this.fullness = Math.max(this.fullness, 0);
  }

  if (this.stamina < this.maxStamina) {
    if (this.isSleeping) {
      this.stamina += this.staminaRecoveryRate * this.deltaTime * 2;
    } else {
      this.stamina += this.staminaRecoveryRate * this.deltaTime;
    }
    this.stamina = Math.min(this.maxStamina, this.stamina);
  }
}

LivingEntity.prototype.applyModifiers = function () {
  for (let modifier of this.modifiers) {
    this[modifier.name] = applyModifier(this[modifier.name], modifier);
  }
}

function applyModifier(location, modifier) {
  switch (modifier.type) {
    case 'add':
      return location + modifier.amount;
    case 'multiply':
      // console.log(`multiplier modifier applied to ${modifier.name}: ${location * modifier.amount}`);
      return location * modifier.amount;
    default:
      console.debug(`modifier type ${modifier.type} not recognized`);
      return location;
  }
}

LivingEntity.prototype.checkSpawnEntity = function (map) {
  if (this.duplicate === 0 && this.energy / this.baseMaxEnergy >= .5) {
    // console.log('duplicating moving entity');
    const randomX = (Math.random() - 0.5) * 2 * 3;
    const randomY = (Math.random() - 0.5) * 2 * 3;

    const spawnX = this.position.x + randomX;
    const spawnY = this.position.y + randomY;
    if (map.withinBorder(spawnX, spawnY)) {
      const spawnBiome = map.getBiome(spawnX, spawnY)[0];
      // console.log('duplicating moving entity - within border');
      //found biome match, can spawn entity
      if (this.spawnBiomes.find(x => x === spawnBiome)) {
        //create child traits
        let childTraits = this.createChildTraits();
        // console.log('duplicating moving entity - acceptable biome');
        //create other needed things
        let spawnSettings = map.entitySettings.find(x => x.name === this.name);
        let baseSpriteIndex = Math.floor(Math.random() * spawnSettings.baseSprites.length);
        // console.log(`this bsi: ${this.baseSpriteIndex}, child bsi: ${baseSpriteIndex}`);
        let entity = new LivingEntity(spawnSettings.name, map.id++, spawnX, spawnY, this.settingsIndex, baseSpriteIndex);
        entity.baseHealthLossRate = spawnSettings.baseHealthLossRate;
        entity.generation = this.generation + 1;
        entity.energy = this.energy;
        entity.baseMaxEnergy = spawnSettings.baseMaxEnergy;
        entity.baseEnergyGainRate = spawnSettings.baseEnergyGainRate;
        entity.baseEnergyLossRate = spawnSettings.baseEnergyLossRate;
        entity.spawnBiomes = spawnSettings.spawnBiomes;
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

LivingEntity.prototype.idleForTime = function (map, duration) {
  this.idle = true;
  this.idleUntilTime = map.time + duration;
  // console.log('idle time set to until ' + this.idleUntilTime.toFixed(2));
  this.currentAction = idleState;
}

LivingEntity.prototype.wander = function (map, aStar) {
  let x = (Math.random() - 0.5) * 2 * this.sight + this.position.x;
  let y = (Math.random() - 0.5) * 2 * this.sight + this.position.y;
  let entity = this;
  aStar.requestPath(this.position, {
    x: x,
    y: y
  }, map, (path) => {
    if (path) {
      if (path && path.length > 0) {
        entity.path = path;
        entity.pathIndex = 0;
        entity.currentAction = followPath;
        entity.wandering = true;
        entity.info = 'wandering';
      } else {
        entity.idleForTime(map, 5);
      }
    } else {
      entity.idleForTime(map, 5);
    }
  });
  entity.currentAction = entityBusy;
}

function idleState(entity, map, goapPlanner, aStar) {
  // console.log(entity.id + ' waiting');
  if (entity.idle) {
    // console.log(`${entity.id} should idle`);
    if (entity.idleUntilTime <= map.time) {
      // console.log(`${entity.id} done idling`);
      entity.idle = false;
    } else {
      entity.info = `idling for a bit`;
      // console.log(`${entity.id} idling for a bit`);
    }
  } else {
    entity.info = "idling...";
    entity.checkGoals(goapPlanner, map);
    if (entity.goals.length === 0) {
      entity.findPotentialGoals(goapPlanner, map, aStar);
    }
  }
}

LivingEntity.prototype.createChildTraits = function () {
  let childTraits = [];
  for (const trait of this.traits) {
    let childTrait = JSON.parse(JSON.stringify(trait));
    childTrait.base = childTrait.amount;
    childTraits.push(childTrait);
  }
  return childTraits;
}

LivingEntity.prototype.findPotentialGoals = function (goapPlanner, map, aStar) {
  let potentionGoals = [];
  let eat = {
    "name": 'eat',
    'potential': (this.maxEnergy - this.energy) / this.maxEnergy,
    'effect': [{
      "type": "min",
      "location": [],
      "property": "energy",
      "amount": this.energy + 1
    }]
  }
  potentionGoals.push(eat);

  let chosenEffect;
  let highestPotential = 0.0;
  for (let potentialGoal of potentionGoals) {
    if (highestPotential < potentialGoal.potential) {
      // console.log(`highest potential ${potentialGoal.name}: ${potentialGoal.potential}`);
      highestPotential = potentialGoal.potential;
      chosenEffect = potentialGoal.effect;
    }
  }

  if (chosenEffect) {
    // console.log('goal chosen');
    this.createPlan(goapPlanner, map, chosenEffect, aStar);
  }
}

LivingEntity.prototype.createPlan = function (goapPlanner, map, goalEffects, aStar) {
  let entity = this;
  // console.log('creating plan');
  goapPlanner.requestPlan(map, this, this, goapPlanner.goap.actions, goalEffects, (plan) => {
    if (plan) {
      // console.log('found plan');
      entity.plan = plan;
      entity.planIndex = 0;
      entity.currentAction = doAction;
      entity.isNearTarget = false;
    } else {
      // console.log('did not find plan');
      entity.goals.splice(0, 1);
      entity.wander(map, aStar);
    }
  });
  this.currentAction = entityBusy;
}

/**
 * checks for goals in the this.goals list, and appends the oldest one this.goals[0]
 */
LivingEntity.prototype.checkGoals = function (goapPlanner, map) {
  if (this.goals.length > 0) {
    let goal = this.goals[0];
    let goalAction = goapPlanner.goap.findAction(goal);
    // console.log(`goal: ${goal}`);
    if (goalAction) {
      this.createPlan(goapPlanner, map, goalAction.effects);
    } else {
      console.log(`could not find a goal action(s) for: ${goal}`);
    }
  }

}

function doAction(entity, map, goapPlanner, aStar) {
  if (entity.doingAction) {
    if (entity.actionCompletionTime <= map.time) {
      entity.doingAction = false;
      let action = entity.plan[entity.planIndex];
      if (action.target) {
        // console.log(`${this.id} unreserved entity ${action.target.id}`);
        action.target.isReserved = false;
      }
      // console.log(`${entity.name} finished doing action: ${action.name}`);
      entity.info = `${this.id} finished doing action: ${action.name}`;
      entity.isNearTarget = false;
      entity.planIndex++;
      entity.isSleeping = false;
      entity.applyAction(action, map);

      // console.log(`new player state: ${JSON.stringify(entity.state)}`);
      if (entity.planIndex >= entity.plan.length) {
        entity.currentAction = idleState;
        // console.log("plan complete!");
        entity.goals.splice(0, 1);
        //TODO: remove entities
      } else {
        //continue doing actions
        entity.currentAction = doAction;
        if (entity.plan[entity.planIndex].name == action.name) {
          entity.isNearTarget = true;
        }
      }
    }
  } else {
    if (entity.plan) {
      let action = entity.plan[entity.planIndex];
      // console.log('action: ' + JSON.stringify(action));
      entity.info = `doing action: ${action.name}`;
      if (action.distanceCost > 0 && !entity.isNearTarget) {
        // console.log(`${entity.id} path request, queue length: ${aStar.queue.getLength()}----------`);
        aStar.requestPath(entity.position, action.target.position, map, (path) => {
          if (path) {
            if (path && path.length > 0) {
              entity.path = path;
              entity.pathIndex = 0;
              entity.currentAction = followPath;
            } else {
              console.log('already there');
              entity.isNearTarget = true;
              entity.currentAction = doAction;
            }
          } else {
            // console.log('an error occured with doAction requestPath, skipping to do action');
            // entity.isNearTarget = true;
            console.log(`${entity.id} did not find path`);
            entity.goals.splice(0, 1);
            entity.idleForTime(map, 5);
          }
        });
        entity.currentAction = entityBusy;
        return;
      } else {
        //do action
        // console.log(entity.name + ' doing action: ' + action.name);
        if (action.sleeping) {
          entity.isSleeping = true;
        }
        if (action.target) {
          if (action.target.isReserved || action.target.destroy || action.noBerries) {
            // console.log(`${entity.id} target ${action.target.id} already reserved or dead upon attempt at action`);
            entity.currentAction = idleState;
            entity.goals.splice(0, 1);
            return;
          } else {
            action.target.isReserved = true;
            // console.log(`${this.id} reserving target: ${action.target.id}`);
          }
        }
        entity.doingAction = true;
        entity.actionCompletionTime = map.time + action.cost;

      }
    } else {
      console.log('no plan to do');
      entity.currentAction = idleState;
    }
  }

}

function entityBusy() {

}

function followPath(entity, map, goapPlanner, aStar) {
  if (entity.path) {
    let distanceLeft = entity.path[entity.pathIndex].moveAgent(entity, entity.deltaTime);
    if (entity.plan && entity.plan[entity.planIndex]) {
      entity.info = `moving to do action: ${entity.plan[entity.planIndex].name}, distance: ${distanceLeft.toFixed(1)}`;
    }
    // console.log(`moving to do action: ${entity.plan[entity.planIndex].name}, distance: ${distanceLeft}`);
    if (entity.path.length - 1 == entity.pathIndex && distanceLeft <= 1) {
      //reached target
      if (entity.wandering) {
        entity.wandering = false;
        entity.currentAction = idleState;
      } else {
        entity.isNearTarget = true;
        entity.currentAction = doAction;
      }
    } else if (distanceLeft < 1) {
      //move to next leg of path
      entity.pathIndex++;
    }
  } else {
    console.log(`no path to follow`);
    entity.currentAction = idleState;
  }
}

LivingEntity.prototype.applyAction = function (action, map) {

  //remove precondition items
  for (let i in action.preconditions) {
    let precondition = action.preconditions[i];
    if (precondition.type == 'item') {
      for (let condition of this.state) {
        if (condition.type === 'item' && precondition.name === condition.name) {
          condition.amount -= precondition.amount;
          if (condition.amount < 0) {
            throw console.error('item conditon amount less than 0: ' + condition.amount);
          }
          //TODO:can remove zero amount preconditions here
          break;
        }
      }
    }
  }

  //add effects items
  for (let i in action.effects) {
    let effect = action.effects[i];
    if (effect.type === 'add') {
      let obj = getFromObject(this, effect.location);

      obj[effect.property] += effect.amount;
      // saveToObject(newState,effect.location, effect.property, newData);
      // console.log(`add applied: ${obj[effect.property]} + ${effect.amount}`);
      //find required reserve precondition location
      // newState.push(newItemCondition);
    } else if (effect.type === 'destroy') {
      if (action.target) {
        action.target.destroy = true;
      } else {
        console.error('did not find target to destroy');
      }
    } else if (effect.type === 'removeItem') {
      if (action.target) {
        // console.log('removing berries');
        action.target.removeBerries(map);
      } else {
        console.error('did not find target to destroy');
      }
    } else if (effect.type === 'self') {
      if (effect.target === 'base stats') {
        if (effect.effect === 'add') {
          this.addToBaseStat(effect.name, effect.amount)
        } else if (effect.effect === 'multiply') {
          //TODO: implement multiply
          console.log('multiply not yet implemented');
        } else {
          console.log(`effect type ${effect.effect} not recognised in action ${action.name}`);
        }
      }
    }
  }

  return this.state;
}

function getFromObject(obj, location) {
  if (location) {
    for (const loc of location) {
      obj = obj[loc];
    }
  }
  return obj;
}

module.exports = LivingEntity;