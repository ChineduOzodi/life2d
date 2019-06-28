AStar = require('../a-star/a-star');
LocationReserve = require('../location-reserve');
Queue = require('../Queue');
GoapPlan = require('./goap-plan');

function GoapPlanner() {
    this.queue = new Queue();
    this.currentTask;
}

GoapPlanner.prototype.startTasks = function() {
    if (!this.currentTask && !this.queue.isEmpty()) {
        this.currentTask = this.queue.dequeue();
    }

    if (this.currentTask) {
        this.createPlan().then( actionPlan => {
            this.currentTask.callBackFunction(actionPlan);
            this.currentTask = null;
            this.startTasks();
        }).catch( err => {
            console.error(err);
            this.currentTask.callBackFunction();
            this.currentTask = null;
            this.startTasks();
        });
    }
}
GoapPlanner.prototype.requestPlan = function(map, agent, state, actions, goal, callBackFunction) {
    this.queue.enqueue(new GoapPlan(map,agent,state,actions,goal,callBackFunction));
    if (!this.currentTask) {
        this.startTasks();
    }
}

GoapPlanner.prototype.createPlan = function () {
    thisPlanner = this;
    return new Promise((resolve, reject) => {
        let usableActions = [];
        // console.log(`total actions: ${actions.length}`);
        for (let action of this.currentTask.actions) {
            if (thisPlanner.isActionUsable(this.currentTask.map, this.currentTask.agent, action)) {
                usableActions.push(action);
            }
        }
        // console.log(`usable actions length: ${usableActions.length}`);
        // console.log(`usable actions: ${JSON.stringify(usableActions)}`);
        let start = new GoapNode(null, 0, 0, this.currentTask.state, null);
        let leaves = [];
        let success = thisPlanner.buildGraph(0, start, leaves, usableActions, this.currentTask.goal, 10000000000);
        if (!success) {
            reject('could not find a plan');
        } else {
            // console.log(`FOUND PLAN(S): ${JSON.stringify(leaves)}`);
            let lowestCost = leaves[0].runningCost + leaves[0].actionCost + leaves[0].distanceCost;
            let selectionNode = leaves[0];
            for (let i in leaves) {
                let leave = leaves[i];
                let totalCost = leave.runningCost + leave.actionCost + leave.distanceCost;
                // console.log(`pAction ${(i + 1)} (${totalCost}): ${actionList(leave)}`);
                if (lowestCost > totalCost) {
                    lowestCost = totalCost;
                    selectionNode = leave;
                }
            }
            // console.log(`selected action: ${JSON.stringify(selectedAction)}`);
            // console.log(`selected steps (${(selectionNode.runningCost + selectionNode.actionCost + selectionNode.distanceCost)}): ${actionList(selectionNode)}`);
            let actionPlan = this.constructPlan([], selectionNode, this.currentTask.map);
            resolve(actionPlan);
        }
    })
}

GoapPlanner.prototype.constructPlan = function (path, node, map) {
    if (node.action) {
        for (let i = 0; i < node.actionRepeat; i++) {
            path.unshift(node.action);
            if (node.action.hasReserve) {
                map.locationReservations.push(node.action.target);
                map.locationReserveChanged = true;
                console.log(`created location reservation for ${node.action.name}`);
            }
        }
    }
    if (node.parent) {
        path = this.constructPlan(path, node.parent, map);
    }
    return path;
}

GoapPlanner.prototype.isActionUsable = function (map, agent, action) {
    // console.log(action.name);
    for (let i in action.preconditions) {
        let precondition = action.preconditions[i];
        if (precondition.type === 'reserve') {
            if (precondition.reserve === 'entity') {
                // console.log(`precondition: ${precondition.name}`);
                let closestEntity = map.findNearestEntity(precondition.name, agent.position);
                // console.log('done searching for nearest entity');
                if (closestEntity) {
                    // console.log(`found closest entity for ${action.name} - ${precondition.name}: ${JSON.stringify(closestEntity)}`);
                    action.distanceCost = distanceCost(closestEntity.position, agent.position) / (agent.speed * 10);
                    action.target = closestEntity;
                } else {
                    // console.log(`could not find closest entity for ${action.name} - ${precondition.name}`);
                    return false;
                }
            } else if (precondition.reserve == 'location') {
                // find and add a location to map.locationReserve
                let dimensions = precondition.dimensions;
                let xOffset = 0;
                let yOffset = 0;
                let attempts = 0;
                let found = false;
                while (attempts < 10) {
                    attempts++;
                    let blocked = false;
                    for (let x = agent.position.x + xOffset; x < agent.position.x + xOffset + dimensions.width; x++) {
                        for (let y = agent.position.y + yOffset; y < agent.position.y + yOffset + dimensions.height; y++) {
                            if (map.map[`x:${x},y:${y}`] && map.map[`x:${x},y:${y}`].vegIndex >= 0) {
                                blocked = true;
                                break;
                            }
                        }
                        if (blocked) {
                            break;
                        }
                    }
                    if (blocked) {
                        xOffset = Math.floor(Math.random() * 100) - 50;
                        yOffset = Math.floor(Math.random() * 100) - 50;
                    } else {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    let position = { x: agent.position.x + xOffset, y: agent.position.y + yOffset };
                    action.hasReserve = true;
                    action.target = new LocationReserve(position, dimensions.width, dimensions.height, agent.id);
                    action.distanceCost = distanceCost(position, agent.position) / (agent.speed * 10);
                } else {
                    console.log(`could not find location for ${action.name}`);
                    return false
                }
            }
        } else if (precondition.type === 'own' && precondition.target) {
            action.distanceCost = distanceCost(precondition.target.position, agent.position) / (agent.speed * 10);
            action.target = precondition.target;
        }
    }

    if (!action.distanceCost) {
        action.distanceCost = 0;
    }

    return true;
}

GoapPlanner.prototype.buildGraph = function (length, parent, leaves, usableActions, goal, minCost) {
    length++;
    let foundOne = false;
    // console.log(`graph - usable actions length: ${usableActions.length}`);
    // console.log(actionList(parent));
    if (length > 20) {
        console.log(`max plan length reached`);
        return false;
    }
    // console.log(`graph len: ${length},\nparent: ${JSON.stringify(parent)}, \nleaves: ${JSON.stringify(leaves)}, \nuActions: ${JSON.stringify(usableActions)}, \ngoal: ${JSON.stringify(goal)}`);
    for (let i in usableActions) {
        let usableAction = usableActions[i];
        if (this.inState(usableAction.preconditions, 1, parent)) {
            // console.log('applying effect');
            //apply effect of action
            let state = this.applyAction(parent.state, usableAction, 1);
            // console.log(`effect applied`);
            let goapNode = new GoapNode(parent, parent.runningCost + parent.actionCost + parent.distanceCost, usableAction.distanceCost, state, usableAction);
            let totalCost = goapNode.runningCost + goapNode.actionCost + goapNode.distanceCost;
            //check if goal  is met
            if (totalCost <= minCost) {
                if (this.inState(goal, 1, goapNode)) {
                    // console.log(`Found plan ${leaves.length + 1}`);
                    // console.log(actionList(goapNode));
                    leaves.push(goapNode);
                    foundOne = true;
                    if (totalCost < minCost) {
                        minCost = totalCost;
                    }
                } else {
                    let newUsableActions = usableActions.map(a => ({ ...a }));
                    newUsableActions.splice(i, 1);
                    let found = this.buildGraph(length, goapNode, leaves, newUsableActions, goal, minCost);
                    if (found) {
                        foundOne = true;
                    }
                }
            }
            
        }
    }
    return foundOne;
}

function distanceCost(pos1, pos2) {
    xDist = math.abs(pos1.x - pos2.x);
    yDist = math.abs(pos1.y - pos2.y);
    sDist = math.abs(xDist - yDist);
    oDist = math.max(xDist, yDist) - sDist;

    return sDist * 10 + oDist * 14;
}

function actionList(goapNode) {
    let action = "";
    if (goapNode.action) {
        action += goapNode.action.name;
    }
    if (goapNode.parent) {
        action += ` <- ${actionList(goapNode.parent)}`;
    }
    return action;
}

GoapPlanner.prototype.applyAction = function (state, action, actionRepeat) {
    // console.log(`state: ${JSON.stringify(state)}`);
    // console.log(`action: ${JSON.stringify(action)}`);
    let newState = JSON.parse(JSON.stringify(state));
    
    //remove precondition items
    for (let i in action.preconditions) {
        let precondition = action.preconditions[i];
        if (precondition.type == 'item') {
            for (let v in newState) {
                let condition = newState[v];
                if (condition.type === 'item' && precondition.name === condition.name) {
                    condition.amount -= precondition.amount * actionRepeat;
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
        // console.log(`effect: ${effect.type}`);

        if (effect.type == 'item') {
            let foundStateItem = false;
            for (let v in newState) {
                let condition = newState[v];
                if (condition.type === 'item' && effect.name === condition.name) {
                    condition.amount += effect.amount * actionRepeat;
                    foundStateItem = true;
                    break;
                }
            }
            if (!foundStateItem) {
                let newItemCondition = Object.assign({}, effect);
                newItemCondition.amount *= actionRepeat;
                newState.push(newItemCondition);
            }
            // console.log(JSON.stringify(newState));
        } else if (effect.type === 'own') {
            let newItemCondition = Object.assign({}, effect);
            //find required reserve precondition location
            newState.push(newItemCondition);
        } else if (effect.type === 'add') {
            let obj = getFromObject(newState,effect.location);

            obj[effect.property] += effect.amount;
            // saveToObject(newState,effect.location, effect.property, newData);
            // console.log(`add applied: ${obj[effect.property]} + ${effect.amount}`);
            //find required reserve precondition location
            // newState.push(newItemCondition);
        }
    }

    return newState;
}

function getFromObject(obj, location) {
    if (location) {
        for (const loc of location) {
            obj = obj[loc];
        }
    }
    return obj;
}

function saveToObject(obj, location, property, data) {
    if (location) {
        for (const loc of location) {
            obj = obj[loc];
        }
    }
    obj[property] = data;
    return obj;
}
/***
 * Makes sure that all the preconditions exist in the current state
 */
GoapPlanner.prototype.inState = function (preconditions, preconditionRepeat, goapNode) {
    let allMatch = true;

    for (let i in preconditions) {
        let precondition = preconditions[i];
        // console.log(`precondigion type: ${precondition.type}`);
        let match = false;
        if (precondition.type === 'own') {
            //search state for that item
            let done = false;
            let count = 0;
            while (!done && count < 10001) {
                count++;
                done = true;
                for (let v in goapNode.state) {
                    let condition = goapNode.state[v];
                    if (condition.type === 'own' && precondition.name === condition.name) {
                        if (precondition.amount <= condition.amount) {
                            match = true;
                            break;
                        } else {
                            //TODO: current own limitation, can't multiply own
                            //see if you can increase condition amount in the parent nodes
                            // let neededItem = Object.assign({},precondition);
                            // neededItem.type = 'item';
                            // let results = this.increaseItemAmount(neededItem, neededItem.amount, goapNode);
                            // if (results) {
                            //     done = false;
                            //     break;
                            // }
                        }
                    }
                }
            }
            if (count >= 10000) {
                console.error(`inState while loop error for equip, broken out of`);
            }
        } else if (precondition.type === 'equip') {
            //search state for that item
            let done = false;
            let count = 0;
            while (!done && count < 10001) {
                count++;
                done = true;
                for (let v in goapNode.state) {
                    let condition = goapNode.state[v];
                    if (condition.type === 'item' && precondition.name === condition.name) {
                        if (precondition.amount <= condition.amount) {
                            match = true;
                            break;
                        } else {
                            //see if you can increase condition amount in the parent nodes
                            let neededItem = Object.assign({}, precondition);
                            neededItem.type = 'item';
                            let results = this.increaseItemAmount(neededItem, neededItem.amount, goapNode);
                            if (results) {
                                done = false;
                                break;
                            }
                        }
                    }
                }
            }
            if (count >= 10000) {
                console.error(`inState while loop error for equip, broken out of`);
            }
        } else if (precondition.type === 'item') {
            let done = false;
            let count = 0;
            while (!done && count < 10001) {
                count++;
                done = true;
                for (let v in goapNode.state) {
                    let condition = goapNode.state[v];
                    if (precondition.type === 'item' && condition.type === 'item') {
                        if (precondition.name === condition.name) {
                            if (precondition.amount * preconditionRepeat <= condition.amount) {
                                match = true;
                                break;
                            } else {
                                //see if you can increase condition amount in the parent nodes
                                let results = this.increaseItemAmount(precondition, preconditionRepeat, goapNode);
                                if (results) {
                                    done = false;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (count >= 10000) {
                console.error(`instate while loop error for item, broken out of`);
            }
        } else if (precondition.type === 'min') {
            let obj = getFromObject(goapNode.state,precondition.location);

            
            if (obj[precondition.property] >= precondition.amount) {
                //met min requirements
                // console.log(`precondition min met: ${obj[precondition.property]} >= ${precondition.amount}`);
                match = true;
            } else {
                match = false;
            }
            // console.log(`add applied: ${obj[precondition.property]} + ${effect.amount}`);
            //find required reserve precondition location
            // newState.push(newItemCondition);
        }
        else if (precondition.type === 'reserve' || precondition.type === 'destroy') {
            //reserve and destroy happens during the execution of the plan
            continue;
        }
        else {
            console.debug(`type: ${precondition.type} not accounted for`);
            return false;
        }
        if (!match) {
            allMatch = false;
            break;
        }
    }
    return allMatch;
}

GoapPlanner.prototype.increaseItemAmount = function (precondition, preconditionRepeat, goapNode) {
    //check if it has an action
    let itemCountIncreased = false;
    if (!goapNode.parent) {
        return itemCountIncreased;
    }

    if (goapNode.action) {
        for (let effect of goapNode.action.effects) {
            if (effect.type === 'item' && precondition.type === 'item') {
                // let newItemCondition = Object.assign({}, effect);
                if (effect.name === precondition.name) {
                    //look for an already existing state for goapNode actions
                    let existingItemAmount = 0;
                    for (let pState of goapNode.parent.state) {
                        if (pState.type === 'item' && pState.name === effect.name) {
                            existingItemAmount = pState.amount;
                            break;
                        }
                    }
                    //increase how many times action is repeated
                    let repeatCount = 0
                    while (repeatCount < 10001 && effect.amount * goapNode.actionRepeat + existingItemAmount < precondition.amount * preconditionRepeat) {
                        repeatCount++;
                        itemCountIncreased = true;
                        goapNode.actionRepeat++;
                    }
                    if (repeatCount === 10000) {
                        console.error('increaseItemAmount experienced infinite loop, was broken out of');
                    }
                    break;
                }
            }
            else if (effect.type === 'self' && precondition.type === 'self') {
                if (effect.name === precondition.name &&
                    effect.target === precondition.target &&
                    effect.effect === precondition.effect) {
                    //look for an already existing state for goapNode actions
                    let existingItemAmount = 0;
                    for (let pState of goapNode.parent.state) {
                        if (pState.type === 'self' &&
                            pState.name === precondition.name &&
                            pState.target === precondition.target &&
                            pState.effect === precondition.effect) {
                            existingItemAmount = pState.amount;
                            break;
                        }
                    }

                    //increase how many times action is repeated
                    let repeatCount = 0
                    while (repeatCount < 10001 && effect.amount * goapNode.actionRepeat + existingItemAmount < precondition.amount * preconditionRepeat) {
                        repeatCount++;
                        itemCountIncreased = true;
                        goapNode.actionRepeat++;
                    }
                    if (repeatCount === 10000) {
                        console.error('increaseItemAmount experienced infinite loop, was broken out of');
                    }
                    break;
                }
            }
        }
        if (itemCountIncreased) {
            //check to make sure preconditions of goapNode action all have enough items, recalculate costs
            for (let actionPrecondition of goapNode.action.preconditions) {
                if (actionPrecondition.type === 'item') {
                    for (let pState of goapNode.parent.state) {
                        if (pState.type === 'item' && pState.name === actionPrecondition.name) {
                            if (actionPrecondition.amount * goapNode.actionRepeat > pState.amount) {
                                let results = this.increaseItemAmount(actionPrecondition, goapNode.actionRepeat, goapNode.parent);
                                if (!results) {
                                    itemCountIncreased = false;
                                }
                            }
                            break;
                        }
                    }
                } else if (actionPrecondition.type === 'self') {
                    for (let pState of goapNode.parent.state) {
                        if (pState.type === 'self' &&
                            pState.name === actionPrecondition.name &&
                            pState.target === actionPrecondition.target &&
                            pState.effect === actionPrecondition.effect) {
                            if (actionPrecondition.amount * goapNode.actionRepeat > pState.amount) {
                                let results = this.increaseItemAmount(actionPrecondition, goapNode.actionRepeat, goapNode.parent);
                                if (!results) {
                                    itemCountIncreased = false;
                                }
                            }
                            break;
                        }
                    }
                }
                if (!itemCountIncreased) {
                    break;
                }
            }
        }
    }

    if (!itemCountIncreased) {
        let results = this.increaseItemAmount(precondition, preconditionRepeat, goapNode.parent);
        if (results) {
            itemCountIncreased = true;
        }
    }

    if (itemCountIncreased) {
        //recalculateCosts
        goapNode.actionCost = goapNode.action.cost * goapNode.actionRepeat;
        goapNode.runningCost = goapNode.parent.runningCost + goapNode.parent.actionCost + goapNode.parent.distanceCost;
        if (goapNode.action) {
            //apply action amount to state
            goapNode.state = this.applyAction(goapNode.parent.state, goapNode.action, goapNode.actionRepeat);
        } else {
            goapNode.state = goapNode.parent.state.map(a => ({ ...a }));
        }
    }

    return itemCountIncreased;
}

function GoapNode(parent, runningCost, distanceCost, state, action) {
    this.runningCost = runningCost;
    this.actionCost = 0;
    this.distanceCost = distanceCost;
    if (action) {
        this.actionCost = action.cost;
    }
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.actionRepeat = 1;
}

module.exports = GoapPlanner;