function GoapPlanner() {
}

GoapPlanner.prototype.createPlan = function (map, agent, worldState, actions, goal) {
    thisPlanner = this;
    return new Promise((resolve, reject) => {
        let usableActions = [];
        for (let i in actions) {
            let action = actions[i];
            if (thisPlanner.isActionUsable(action)) {
                usableActions.push(map, agent, action);
            }
        }
        console.log(`usable actions length: ${usableActions.length}`);
        // console.log(`usable actions: ${JSON.stringify(usableActions)}`);
        let start = new GoapNode(null, 0, worldState, null);
        let leaves = [];
        let success = thisPlanner.buildGraph(0,start, leaves, usableActions, goal);
        if (!success) {
            reject('could not find a plan');
        } else{
            console.log(`FOUND PLAN(S): ${JSON.stringify(leaves)}`)
        }
    })
}

GoapPlanner.prototype.isActionUsable = function (map, agent, action) {
    return true;
}

GoapPlanner.prototype.buildGraph = function (length, parent, leaves, usableActions, goal) {
    length++;
    let foundOne = false;
    // console.log(`graph - usable actions length: ${usableActions.length}`);
    if (length > 2) {
        console.log(`max plan length reached`);
        return false;
    }
    // console.log(`graph len: ${length}, parent: ${JSON.stringify(parent)}, leaves: ${JSON.stringify(leaves)}, uActions: ${JSON.stringify(usableActions)}, goal: ${JSON.stringify(goal)}`);
    for (let i in usableActions) {
        usableAction = usableActions[i];
        if (this.inState(usableAction.preconditions, parent.state)) {
            //apply effect of action
            let state = this.applyAction(parent.state, usableAction);
            let goapNode = new GoapNode(parent, parent.runningCost + usableAction.cost, state, usableAction);

            //check if goal  is met
            if (this.inState(goal, state)) {
                leaves.push(goapNode);
                foundOne = true;
            } else {
                let found = this.buildGraph(length,goapNode, leaves, usableActions, goal);
                if (found) {
                    foundOne = true;
                }
            }
        }
    }
    return foundOne;
}

GoapPlanner.prototype.applyAction = function (state, action) {
    let newState = state.slice();
    
    //remove precondition items
    for (let i in action.preconditions) {
        let precondition = action.preconditions[i];
        if (precondition.type == 'item') {
            for (let v in newState) {
                let condition = newState[v];
                if (condition.type === 'item' && precondition.name[0] === condition.name[0]) {

                    let newItemCondition = Object.assign({}, condition);
                    newItemCondition.amount -= precondition.amount;
                    if (newItemCondition.amount < 0) {
                        throw console.error('item conditon amount less than 0: ' + newItemCondition.amount);
                    } else if (newItemCondition.amount == 0) {
                        //TODO: remove from newState

                    }
                    break;
                }
            }
        }
    }

    //add effects items
    for (let i in action.effects) {
        let effect = action.effects[i];
        if (effect.type == 'item') {
            let newItemCondition = Object.assign({}, effect);
            for (let v in state) {
                let condition = state[v];
                if (condition.type === 'item' && effect.name[0] === condition.name[0]) {
                    newItemCondition.amount += condition.amount;
                    break;
                }
            }
            console.log(JSON.stringify(newState));
            newState.push(newItemCondition);
        } else if (effect.type === 'own') {
            let newItemCondition = Object.assign({}, effect);
            newState.push(newItemCondition);
        }
    }

    return newState;
}

GoapPlanner.prototype.inState = function (preconditions, currentState) {
    let allMatch = true;

    for (let i in preconditions) {
        let precondition = preconditions[i];
        let match = false;
        if (precondition.type != 'item') {
            continue;
        }
        for (let v in currentState) {
            let condition = currentState[v];
            if (precondition.type === 'item' && condition.type === 'item') {
                if (precondition.name[0] === condition.name[0]) {
                    if (precondition.amount <= condition.amount) {
                        match = true;
                        break;
                    }
                }
            }
        }
        if (!match) {
            allMatch = false;
        }
    }
    return allMatch;
}

function GoapNode(parent, runningCost, state, action) {
    this.runningCost = runningCost;
    this.state = state;
    this.parent = parent;
    this.action = action;
}

module.exports = GoapPlanner;