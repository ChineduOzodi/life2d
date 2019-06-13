var Entity = require('./entity');
var GoapPlanner = require('./goap-planner');
AStar = require('./a-star');

function MovingEntity(entity, id, x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this, entity, id, x, y, settingsIndex, baseSpriteIndex);
  this.goals = [];
  this.actionPlan = [];
  this.currentAction = idleState;
  this.energy = 0;
  this.maxEnergy = 0;
  this.energyGainRate = 0;
  this.energyLossRate = 0;
  this.baseMaxEnergy = 0;      // received from settings
  this.baseEnergyGainRate = 0; // receieved from settings
  this.baseEnergyLossRate = 0; // receieved from settings
  this.traits = [];
  this.modifiers = [];
  this.isSleeping = false;
}

MovingEntity.prototype = Object.create(Entity.prototype);

MovingEntity.prototype.run = function (map, goap, deltaTime) {
  this.resetBaseAttributes();
  this.applyModifiers();
  this.applyBaseRates(deltaTime);
  this.currentAction(this, map, goap);
  // console.log(`energy: ${this.energy}`);
}

MovingEntity.prototype.resetBaseAttributes = function () {
  this.maxEnergy = this.baseMaxEnergy;
  this.energyGainRate = this.baseEnergyGainRate;
  this.energyLossRate = this.baseEnergyLossRate;
}

MovingEntity.prototype.addToBaseStat = function (statName, amount) {
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

MovingEntity.prototype.applyBaseRates = function (deltaTime) {
  if (this.isSleeping) {
    // this.energy += this.energyGainRate * deltaTime;
    // this.energy = Math.min(this.energy, this.maxEnergy);
  } else {
    this.energy -= this.energyLossRate * deltaTime;
    this.energy = Math.max(this.energy, 0);
  }

  if (this.fullness > 0) {
    if (this.isSleeping) {
      this.fullness -= this.hungerRate * deltaTime * 0.5;
    } else {
      this.fullness -= this.hungerRate * deltaTime;
    }
    this.fullness = Math.max(this.fullness, 0);
  }

  if (this.stamina < this.maxStamina) {
    if (this.isSleeping) {
      this.stamina += this.staminaRecoveryRate * deltaTime * 2;
    } else {
      this.stamina += this.staminaRecoveryRate * deltaTime;
    }
    this.stamina = Math.min(this.maxStamina, this.stamina);
  }
}

MovingEntity.prototype.applyModifiers = function () {
  for (let modifier of this.modifiers) {
    switch (modifier.name) {
      case 'speed':
        this.speed = applyModifier(this.speed, modifier);
        break;
      case 'sleepRate':
        this.energyGainRate = applyModifier(this.energyGainRate, modifier);
        break;
      case 'stamina':
        this.stamina = applyModifier(this.stamina, modifier);
        break;
      case 'staminaRecoveryRate':
        this.staminaRecoveryRate = applyModifier(this.staminaRecoveryRate, modifier);
        break;
      case 'fullness':
        this.fullness = applyModifier(this.fullness, modifier);
        break;
      default:
      // code block
    }
  }
}

function applyModifier(location, modifier) {
  switch (modifier.type) {
    case 'add':
      return location + modifier.amount;
    case 'multiply':
      return location * modifier.amount;
    default:
      console.debug(`modifier type ${modifier.type} not recognized`);
      return location;
  }
}

function idleState(entity, map, goap) {
  // console.log('waiting');
  entity.info = "idling...";
  entity.checkGoals(goap, map);
  if (entity.goals.length === 0) {
    entity.findPotentialGoals(goap, map);
  }
}

MovingEntity.prototype.findPotentialGoals = function (goap, map) {
  let potentionGoals = [];
  let sleep = {
    "name": 'sleep',
    'potential': (this.maxEnergy - this.energy) / this.maxEnergy,
    'preconditions': [
      {
        "type": "self",
        "target": "base stats",
        "effect": "add",
        "name": "energy",
        "amount": this.maxEnergy - this.energy
      }
    ]
  }
  potentionGoals.push(sleep);
  let eat = {
    'name': 'eat',
    'potential': (this.maxFullness - this.fullness) / this.maxFullness,
    'preconditions': [
      {
        "type": "self",
        "target": "base stats",
        "effect": "add",
        "name": "fullness",
        "amount": this.maxFullness - this.fullness
      }
    ]
  }
  potentionGoals.push(eat);

  let chosenPreconditions;
  let highestPotential = .2;
  for (let potentialGoal of potentionGoals) {
    if (highestPotential < potentialGoal.potential) {
      console.log(`highest potential ${potentialGoal.name}: ${potentialGoal.potential}`);
      highestPotential = potentialGoal.potential;
      chosenPreconditions = potentialGoal.preconditions;
    }
  }

  if (chosenPreconditions) {
    this.createPlan(goap, map, chosenPreconditions);
  }
}

MovingEntity.prototype.createPlan = function (goap, map, goalEffects) {
  let goapPlanner = new GoapPlanner();
  console.log('creating plan');
  goapPlanner.createPlan(map, this, this.state, goap.actions, goalEffects).then((plan) => {
    if (plan) {
      console.log('found plan');
      this.plan = plan;
      this.planIndex = 0;
      this.currentAction = doAction;
      this.isNearTarget = false;
    }
    else {
      console.log('did not find plan');
      this.currentAction = idleState;
    }
  }).catch(err => {
    console.error(`an error with creating plan for ${goal} occurred`);
    console.error(err);
    this.goals.splice(0, 1);
    this.currentAction = idleState;
  });
  this.currentAction = entityBusy;
}

/**
 * checks for goals in the this.goals list, and appends the oldest one this.goals[0]
 */
MovingEntity.prototype.checkGoals = function (goap, map) {
  if (this.goals.length > 0) {
    let goal = this.goals[0];
    let goalAction = goap.findAction(goal);
    console.log(`goal: ${goal}`);
    if (goalAction) {
      this.createPlan(goap, map, goalAction.effects);
    } else {
      console.log(`could not find a goal action(s) for: ${goal}`);
    }
  }

}

function doAction(entity, map) {
  if (entity.plan) {
    let action = entity.plan[entity.planIndex];
    // console.log('action: ' + JSON.stringify(action));
    entity.info = `doing action: ${action.name}`;
    if (action.distanceCost > 0 && !entity.isNearTarget) {
      let aStar = new AStar();
      aStar.findPath(entity.position, action.target.position, map).then((path) => {
        if (path && path.length > 0) {
          entity.path = path;
          entity.pathIndex = 0;
          entity.currentAction = followPath;
        } else {
          console.log('already there');
          entity.isNearTarget = true;
          entity.currentAction = doAction;
        }
      }).catch((err) => {
        console.log('an error occured with doAction findPath');
        console.error(err);
      })
    } else {
      //do action
      console.log(entity.name + ' doing action: ' + action.name);
      if (action.sleeping) {
        entity.isSleeping = true;
      }
      setTimeout(() => {
        console.log(`${entity.name} finished doing action: ${action.name}`);
        entity.info = `finished doing action: ${action.name}`;
        entity.isNearTarget = false;
        entity.planIndex++;
        entity.isSleeping = false;
        entity.applyAction(action, map);
        // console.log(`new player state: ${JSON.stringify(entity.state)}`);
        if (entity.planIndex >= entity.plan.length) {
          entity.currentAction = idleState;
          console.log("plan complete!");
          entity.goals.splice(0, 1);
          //TODO: remove entities
        } else {
          entity.currentAction = doAction;
          if (entity.plan[entity.planIndex].name == action.name) {
            entity.isNearTarget = true;
          }
        }
      }, (action.cost * 1000));
      entity.currentAction = entityBusy;
    }
  } else {
    console.log('no plan to do');
    entity.currentAction = idleState;
  }
}

function entityBusy() {

}

function followPath(entity) {
  if (entity.path) {
    let distanceLeft = entity.path[entity.pathIndex].moveAgent(entity, 1 / 60);
    entity.info = `moving to do action: ${entity.plan[entity.planIndex].name}, distance: ${distanceLeft}`;
    if (entity.path.length - 1 == entity.pathIndex && distanceLeft <= 1) {
      //reached target
      entity.isNearTarget = true;
      entity.currentAction = doAction;
    } else if (distanceLeft == 0) {
      //move to next leg of path
      entity.pathIndex++;
    }
  } else {
    console.log(`no path to follow`);
    entity.currentAction = idleState;
  }
}

MovingEntity.prototype.applyAction = function (action, map) {

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
    if (effect.type == 'item') {
      let foundStateItem = false;
      for (let v in this.state) {
        let condition = this.state[v];
        if (condition.type === 'item' && effect.name === condition.name) {
          condition.amount += effect.amount;
          foundStateItem = true;
          break;
        }
      }
      if (!foundStateItem) {
        let newItemCondition = Object.assign({}, effect);
        this.state.push(newItemCondition);
      }
      // console.log(JSON.stringify(this.state));
    } else if (effect.type === 'own') {
      let index = map.entitySettings.findIndex(x => x.name === effect.name);
      if (index == -1) {
        console.error(`could not find settings for ${effect.name} in otherSettings`);
      } else {
        let newItemCondition = Object.assign({}, effect);
        newItemCondition.target = action.target;
        this.state.push(newItemCondition);

        let entitySettings = map.entitySettings[index];
        let v = Math.floor(Math.random() * entitySettings.baseSprites.length);
        let entity = new Entity(effect.name, map.id++, action.target.position.x, action.target.position.y, index, v);
        map.entities.push(entity);
        for (let x = action.target.position.x; x < action.target.position.x + action.target.width; x++) {
          for (let y = action.target.position.y; y < action.target.position.y + action.target.height; y++) {
            if (map.map[`x:${x},y:${y}`]) {
              console.error(`map of x:${x},y:${y} already exists, can't set owned`);
            }
            else {
              map.map[`x:${x},y:${y}`] = {
                biome: map.getBiome(x, y),
                height: map.getHeight(x, y),
                entityIndex: map.entities.length - 1
              };
            }
          }
        }
      }
    } else if (effect.type === 'destroy') {
      if (action.target) {
        action.target.destroy = true;
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

module.exports = MovingEntity;