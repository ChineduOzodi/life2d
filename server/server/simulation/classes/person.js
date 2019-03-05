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



// Person.prototype.run = function(map) {
// 	if (this.targetCity == null) {
//     if(this.wait > 0) {
//       this.wait--;
//       return;
//     }
//     var possibleCities = [];
//     var nav = map.map[this.position.x][this.position.y].navigation;
//     // var totalDist = 0;
//     //select target city
//     for (let key in nav) {
//     	// check if the property/key is defined in the object itself, not in parent
//     	if (nav.hasOwnProperty(key)) {
//         //console.log(key, dictionary[key]);
//       	let node = nav[key];
//         if (node.direction.x != 0 && node.direction.y != 0) {
//           //console.log("key: " + key);
//           //console.log("direction (" + node.direction.x + "," + node.direction.y + ")");
//           possibleCities.push(key);
//           //let dista = 1000.0 / nav[key].hCost;
//           this.pCities[key] = 1000.0 / nav[key].hCost * math.random(0,1);
//         }
//     	}
// 		}
//     if (possibleCities.length > 0) {
//       this.targetCity = possibleCities[0];
//       //console.log("cities: " + possibleCities);
//     	//this.targetCity =  possibleCities[floor(random(0,possibleCities.length))];
//       let rNum = this.pCities[possibleCities[0]];
//       //console.log("totalDist: " + totalDist);
//       //console.log("rNum: " + rNum);
//       for(let i = 0; i < possibleCities.length; i++) {
//         let key = possibleCities[i];
//         if (rNum < this.pCities[key]) {
//           //console.log("cityDist: " + nav[key].dista);
//           //console.log("rNum: " + rNum);
//           this.targetCity = key;
//           rNum = this.pCities[key];
//         }
//       }
//       //console.log("Found city: " + this.targetCity);
//     }
//   }
//   if (this.targetCity != null) {
//     //move
//     if (this.moveCount > 0) {
//       this.moveCount--;
//       //console.log(this.moveCount);
//     }

//     else {
//       //console.log("moving");
// 			let currentTile = map.map[this.position.x][this.position.y];
//       currentTile.peopleCount--;
//       if (currentTile.peopleCount <= 0) {
//         currentTile.stateChanged = true;
//       }
//       let cNode = currentTile.navigation[this.targetCity];
//       this.position = createVector(cNode.direction.x + this.position.x,cNode.direction.y + this.position.y);
//       this.moveCount = currentTile.navigation[this.targetCity].gCost;
//       let newTile = map.map[this.position.x][this.position.y];
//       newTile.peopleCount++;
//       let createRoad = true;
//       //if(newTile.road == 0) {
//       //  //check neighbor
//   		//	for (let nx = this.position.x -1; nx < this.position.x + 2; nx++) {
//     	//		for (let ny = this.position.y -1; ny < this.position.y + 2; ny++) {
//       //      //continue if out of bounds
//       //      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
//       //        continue; 
//       //      }
//       //      
//       //      let nTile = map.map[nx][ny];
//       //      if(nTile.nRoadCount > 4) {
//       //        createRoad = false;
//       //      }
//       //    }
//       //  }
//       //}
//       if(createRoad) {
//         //check neighbor
//   			for (let nx = this.position.x -1; nx < this.position.x + 2; nx++) {
//     			for (let ny = this.position.y -1; ny < this.position.y + 2; ny++) {
//             //continue if out of bounds
//             if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
//               continue; 
//             }

//             let nTile = map.map[nx][ny];
//             nTile.nRoadCount++;
//           }
//         }
//       }

//       if (newTile.road <= 900 && createRoad) {
//         newTile.road += 50;
//       }

//       if (newTile.peopleCount == 1) {
//         newTile.stateChanged = true;
//       }

//       //check if arrived
//       if (map.cities[this.targetCity].position.x == this.position.x && map.cities[this.targetCity].position.y == this.position.y){
//         this.targetCity = null;
//       }
//     }
//   }
// }

function idleState(entity, map) {
  // console.log('waiting');
}

function doAction(entity, map) {
  if (entity.plan) {
    let action = entity.plan[entity.planIndex];
    console.log('action: ' + JSON.stringify(action));
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
        this.plan = plan;
        this.planIndex = 0;
        this.currentAction = doAction;
        this.isNearTarget = false;
      }
    });
  } else {
    console.log(`could not find a goal action for: ${goal}`);
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