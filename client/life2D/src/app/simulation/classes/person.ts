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
    energy: number;
    maxEnergy: number;
    energyGainRate: number;
    energyLossRate: number;
    hungerRate: number;
    stamina: number;
    maxStamina: number;
    staminaRecoveryRate: number;
    fullness: number;
    maxFullness: number;
    modifiers = [];
    isSleeping: boolean;
    goals = [];
    constructor(id: string, position: Position, speed: number, settingsIndex: number, baseSpriteIndex: number) {
        super('person', id, position, settingsIndex, baseSpriteIndex);

    }

}
