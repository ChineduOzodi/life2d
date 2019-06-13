import { Entity } from './entity';
import { Position } from './position';
export class MovingEntity extends Entity {
    goal: string;
    actionPlan = [];
    actionPlanIndex = 0;
    isNearTarget = false;
    path = [];
    pathIndex: number;
    energy: number;
    maxEnergy: number;
    energyGainRate: number;
    energyLossRate: number;
    traits = [];
    modifiers = [];
    isSleeping: boolean;
    goals = [];

    constructor(id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super('person', id, position, settingsIndex, baseSpriteIndex);

    }
}
