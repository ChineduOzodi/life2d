AStar = require('./a-star');

function GoapPlanner() {
}

GoapPlanner.prototype.createPlan = function (map, agent, worldState, actions, goal) {
    thisPlanner = this;
    return new Promise((resolve, reject) => {
        let usableActions = [];
        for (let i in actions) {
            let action = actions[i];
            if (thisPlanner.isActionUsable(map, agent, action)) {
                usableActions.push(action);
            }
        }
        console.log(`usable actions length: ${usableActions.length}`);
        // console.log(`usable actions: ${JSON.stringify(usableActions)}`);
        let start = new GoapNode(null, 0, worldState, null);
        let leaves = [];
        let success = thisPlanner.buildGraph(0, start, leaves, usableActions, goal);
        if (!success) {
            reject('could not find a plan');
        } else {
            // console.log(`FOUND PLAN(S): ${JSON.stringify(leaves)}`);
            let lowestCost = leaves[0].runningCost + leaves[0].actionCost;
            let selectedAction = leaves[0];
            for( let i in leaves){
                let leave = leaves[i];
                let totalCost = leave.runningCost + leave.actionCost;
                // console.log(`pAction ${(i + 1)} (${totalCost}): ${actionList(leave)}`);
                if (lowestCost > totalCost){
                    lowestCost = totalCost;
                    selectedAction = leave;
                }
            }
            // console.log(`selected action: ${JSON.stringify(selectedAction)}`);
            console.log(`selected steps (${(selectedAction.runningCost + selectedAction.actionCost)}): ${actionList(selectedAction)}`);
            resolve(selectedAction);
        }
    })
}

GoapPlanner.prototype.isActionUsable = function (map, agent, action) {
    for (let i in action.preconditions){
        let precondition = action.preconditions[i];
        if (precondition.type == 'reserve' && precondition.reserve == 'entity') {
            let closestEntity = map.findNearestEntity(precondition.name, map.vegetation, agent.position);
            if(closestEntity){
                console.log(`found closest entity for ${action.name} - ${precondition.name}: ${JSON.stringify(closestEntity)}`);
                let aStar = new AStar();
                aStar.findPath(agent.position,closestEntity.position,map);
            }else{
                console.log(`could not find closest entity for ${action.name} - ${precondition.name}`);
            }
        }
    }
    
    return true;
}

GoapPlanner.prototype.buildGraph = function (length, parent, leaves, usableActions, goal) {
    length++;
    let foundOne = false;
    // console.log(`graph - usable actions length: ${usableActions.length}`);
    // console.log(actionList(parent));
    if (length > 20) {
        console.log(`max plan length reached`);
        return false;
    }
    // console.log(`graph len: ${length}, parent: ${JSON.stringify(parent)}, leaves: ${JSON.stringify(leaves)}, uActions: ${JSON.stringify(usableActions)}, goal: ${JSON.stringify(goal)}`);
    for (let i in usableActions) {
        let usableAction = usableActions[i];
        if (this.inState(usableAction.preconditions, 1, parent)) {
            //apply effect of action
            let state = this.applyAction(parent.state, usableAction, 1);

            let goapNode = new GoapNode(parent, parent.runningCost + parent.actionCost, state, usableAction);

            //check if goal  is met
            if (this.inState(goal, 1, goapNode)) {
                leaves.push(goapNode);
                foundOne = true;
            } else {
                let newUsableActions = usableActions.map(a => ({...a}));
                newUsableActions.splice(i, 1);
                let found = this.buildGraph(length, goapNode, leaves, newUsableActions, goal);
                if (found) {
                    foundOne = true;
                }
            }
        }
    }
    return foundOne;
}

function actionList (goapNode) {
    let action = "";
    if (goapNode.action) {
        action += goapNode.action.name;
    }
    if (goapNode.parent){
        action += ` <- ${actionList(goapNode.parent)}`;
    }
    return action;
}

GoapPlanner.prototype.applyAction = function (state, action, actionRepeat) {
    let newState = state.map(a => ({...a}));

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
            if (!foundStateItem){
                let newItemCondition = Object.assign({}, effect);
                newItemCondition.amount *= actionRepeat;
                newState.push(newItemCondition);
            }
            // console.log(JSON.stringify(newState));
        } else if (effect.type === 'own') {
            let newItemCondition = Object.assign({}, effect);
            newState.push(newItemCondition);
        }
    }

    return newState;
}

GoapPlanner.prototype.inState = function (preconditions, preconditionRepeat, goapNode) {
    let allMatch = true;

    for (let i in preconditions) {
        let precondition = preconditions[i];
        let match = false;
        if (precondition.type === 'own'){
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
        }
        else if (precondition.type === 'equip') {
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
                            let neededItem = Object.assign({},precondition);
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
        } else {
            continue;
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
    if (!goapNode.parent){
        return itemCountIncreased;
    }

    if (goapNode.action) {
        for (let i in goapNode.action.effects) {
            let effect = goapNode.action.effects[i];
            if (effect.type === 'item') {
                // let newItemCondition = Object.assign({}, effect);
                if (precondition.type === 'item' && effect.name === precondition.name) {
                    //look for an already existing state for goapNode actions
                    let existingItemAmount = 0;
                    for (let s in goapNode.parent.state){
                        let pState = goapNode.parent.state[s];
                        if (pState.type === 'item' && pState.name === effect.name){
                            existingItemAmount = pState.amount;
                            break;
                        }
                    }
                    //increase how many times action is repeated
                    let repeatCount = 0
                    while (repeatCount < 10001 && effect.amount * goapNode.actionRepeat + existingItemAmount  < precondition.amount * preconditionRepeat) {
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
            for (let i in goapNode.action.preconditions) {
                let precondition = goapNode.action.preconditions[i];
                if (precondition.type === 'item') {
                    for (let s in goapNode.parent.state){
                        let pState = goapNode.parent.state[s];
                        if (pState.type === 'item' && pState.name === precondition.name){
                            if (precondition.amount * goapNode.actionRepeat > pState.amount){
                                let results = this.increaseItemAmount(precondition, goapNode.actionRepeat, goapNode.parent);
                                if (!results) {
                                    itemCountIncreased = false;
                                }
                            }
                            break;
                        }
                    }
                    
                }
                if(!itemCountIncreased){
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
        goapNode.runningCost = goapNode.parent.runningCost + goapNode.parent.actionCost;
        if (goapNode.action) {
            //apply action amount to state
            goapNode.state = this.applyAction(goapNode.parent.state, goapNode.action, goapNode.actionRepeat);
        } else {
            goapNode.state = goapNode.parent.state.map(a => ({...a}));
        }
    }

    return itemCountIncreased;
}

function GoapNode(parent, runningCost, state, action) {
    this.runningCost = runningCost;
    this.actionCost = 0;
    if (action) {
        this.actionCost = action.cost;
    }
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.actionRepeat = 1;
}

module.exports = GoapPlanner;