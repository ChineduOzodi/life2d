var Entity = require('./entity');
var GoapPlanner = require('./goap-planner');
AStar = require('./a-star');

function Person(id, x, y, speed, settingsIndex, baseSpriteIndex) {
  Entity.call(this, 'person', id, x, y, settingsIndex, baseSpriteIndex);
  this.state = 'idle';
  this.speed = speed;
  this.goal = '';
  this.state = [
    {
      "type": "item",
      "name": "stone axe",
      "amount": 1
  }
  ];
  this.actionPlan = [];
  this.currentAction = idleState;
}

Person.prototype = Object.create(Entity.prototype);

Person.prototype.run = function (map) {
  this.currentAction(this, map);
}

function idleState(entity, map) {
  // console.log('waiting');
}

function doAction(entity, map) {
  if (entity.plan) {
    let action = entity.plan[entity.planIndex];
    // console.log('action: ' + JSON.stringify(action));
    if (action.distanceCost > 0 && !entity.isNearTarget) {
      let aStar = new AStar();
      aStar.findPath(entity.position, action.target.position, map).then((path) => {
        entity.path = path;
        entity.pathIndex = 0;
        entity.currentAction = followPath;
      }).catch((err) => {
        console.log('an error occured with doAction findPath');
        console.error(err);
      })
    } else {
      //do action
      console.log(entity.name + ' doing action: ' + action.name);
      setTimeout(() => {
        console.log(`${entity.name} finished doing action: ${action.name}`);
        entity.isNearTarget = false;
        entity.planIndex++;
        entity.state = applyAction(entity.state, action);
        // console.log(`new player state: ${JSON.stringify(entity.state)}`);
        if (action.target && action.target.destroy) {
          map.updateVegetation = true;
        }
        if (entity.planIndex >= entity.plan.length) {
          entity.currentAction = idleState;
          console.log("plan complete!");
          entity.goal = '';
          //TODO: remove entities
        } else {
          entity.currentAction = doAction;
          if (entity.plan[entity.planIndex].name == action.name){
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

function entityBusy(entity, map) {

}

Person.prototype.setGoal = function (goal, goap, map) {
  let goalAction = goap.findAction(goal);
  if (goalAction) {
    let goapPlanner = new GoapPlanner();
    goapPlanner.createPlan(map, this, this.state, goap.actions, goalAction.effects).then((plan) => {
      if (plan) {
        this.goal = goal;
        this.plan = plan;
        this.planIndex = 0;
        this.currentAction = doAction;
        this.isNearTarget = false;
      }
    });
  } else {
    console.log(`could not find a goal action(s) for: ${goal}`);
  }
}

function followPath(entity, map) {
  if (entity.path) {
    let distanceLeft = entity.path[entity.pathIndex].moveAgent(entity, 1 / 60);
    if (entity.path.length - 1 == entity.pathIndex && distanceLeft <= 1) {
      //reached target
      entity.isNearTarget = true;
      entity.currentAction = doAction;
    }else if (distanceLeft == 0){
      //move to next leg of path
      entity.pathIndex++;
    }
  } else {
    console.log(`no path to follow`);
    entity.currentAction = idleState;
  }
}

var applyAction = function (state, action) {
  let newState = state.map(a => ({ ...a }));

  //remove precondition items
  for (let i in action.preconditions) {
    let precondition = action.preconditions[i];
    if (precondition.type == 'item') {
      for (let v in newState) {
        let condition = newState[v];
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
      for (let v in newState) {
        let condition = newState[v];
        if (condition.type === 'item' && effect.name === condition.name) {
          condition.amount += effect.amount;
          foundStateItem = true;
          break;
        }
      }
      if (!foundStateItem) {
        let newItemCondition = Object.assign({}, effect);
        newState.push(newItemCondition);
      }
      // console.log(JSON.stringify(newState));
    } else if (effect.type === 'own') {
      let newItemCondition = Object.assign({}, effect);
      newState.push(newItemCondition);
    } else if (effect.type === 'destroy') {
      if (action.target) {
        action.target.destroy = true;
      } else {
        console.error('did not find target to destroy');
      }
    }
  }

  return newState;
}

function createVector(x, y) {
  return { x: x, y: y };
}

module.exports = Person;