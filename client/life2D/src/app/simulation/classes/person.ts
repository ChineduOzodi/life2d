import { Entity } from './entity';
import { Position } from './position';
export class Person extends Entity {

    state = [];
    speed: number;
    goal: string;
    actionPlan = [];
    actionPlanIndex = 0;
    isNearTarget = false;
    path = [];
    pathIndex: number;

    constructor(id: string, position: Position, speed: number, settingsIndex: number, baseSpriteIndex: number) {
        super('person', id, position, settingsIndex, baseSpriteIndex);

    }

}
