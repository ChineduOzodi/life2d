import { Entity } from './entity';
import { Position } from './position';
export class Person extends Entity {

    state = [];
    speed: number;
    goal: string;
    actionPlan = [];
    actionPlanIndex = 0;
    currentAction = this.idleState;
    isNearTarget = false;
    path = [];
    pathIndex: number;

    constructor(id: string, position: Position, speed: number, settingsIndex: number, baseSpriteIndex: number) {
        super('person', id, position, settingsIndex, baseSpriteIndex);

    }

    run(map: any) {
        this.currentAction(map);
    }

    setGoal(goal, goap, map) {
        const goalAction = goap.findAction(goal);
        if (goalAction) {
            const goapPlanner = new GoapPlanner();
            goapPlanner.createPlan(map, this, this.state, goap.actions, goalAction.effects).then((plan) => {
                if (plan) {
                    this.actionPlan = plan;
                    this.actionPlanIndex = 0;
                    this.currentAction = this.doAction;
                    this.isNearTarget = false;
                }
            });
        } else {
            console.log(`could not find a goal action for: ${goal}`);
        }
    }

    idleState(map: any) {

    }

    doAction(map) {
        if (this.actionPlan) {
            const action = this.actionPlan[this.actionPlanIndex];
            console.log('action: ' + JSON.stringify(action));
            if (action.distanceCost > 0 && !this.isNearTarget) {
                const aStar = new AStar();
                aStar.findPath(this.position, action.target.position, map).then((path) => {
                    this.path = path;
                    this.pathIndex = 0;
                    this.currentAction = this.followPath;
                }).catch((err) => {
                    console.log('an error occured with doAction findPath');
                    console.error(err);
                });
            } else {
                // do action
                console.log(this.name + ' doing action: ' + action.name);
                setTimeout(() => {
                    console.log(`${this.name} finished doing action: ${action.name}`);
                    this.isNearTarget = false;
                    this.actionPlanIndex++;
                    this.state = this.applyAction(this.state, action);
                    console.log(`new player state: ${JSON.stringify(this.state)}`);
                    if (this.actionPlanIndex >= this.actionPlan.length) {
                        this.currentAction = this.idleState;
                        console.log('plan complete!');
                        // TODO: remove entities
                    } else {
                        this.currentAction = this.doAction;
                        if (this.actionPlan[this.actionPlanIndex].name === action.name) {
                            this.isNearTarget = true;
                        }
                    }
                }, (action.cost * 1000));
                this.currentAction = this.entityBusy;
            }
        } else {
            console.log('no plan to do');
            this.currentAction = this.idleState;
        }
    }

    entityBusy(map) {

    }

    followPath(map) {
        if (this.path) {
            if (this.path[this.pathIndex].moveAgent(this, 1 / 60)) {
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    this.isNearTarget = true;
                    this.currentAction = this.doAction;
                }
            }
        } else {
            console.log(`no path to follow`);
            this.currentAction = this.idleState;
        }
    }

    applyAction(state, action) {
        const newState = state.map(a => ({ ...a }));

        // remove precondition items
        for (const  precondition of action.preconditions) {
            if (precondition.type === 'item') {
                for (const condition of newState) {
                    if (condition.type === 'item' && precondition.name === condition.name) {
                        condition.amount -= precondition.amount;
                        if (condition.amount < 0) {
                            throw console.error('item conditon amount less than 0: ' + condition.amount);
                        }
                        // TODO:can remove zero amount preconditions here
                        break;
                    }
                }
            }
        }

        // add effects items
        for (const effect of action.effects) {
            if (effect.type === 'item') {
                let foundStateItem = false;
                for (const condition of newState) {
                    if (condition.type === 'item' && effect.name === condition.name) {
                        condition.amount += effect.amount;
                        foundStateItem = true;
                        break;
                    }
                }
                if (!foundStateItem) {
                    const newItemCondition = Object.assign({}, effect);
                    newState.push(newItemCondition);
                }
                // console.log(JSON.stringify(newState));
            } else if (effect.type === 'own') {
                const newItemCondition = Object.assign({}, effect);
                newState.push(newItemCondition);
            }
        }

        return newState;
    }
}
