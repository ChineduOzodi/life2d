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
    modifiers = [];
    isSleeping: boolean;
    goals = [];

    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super(name, 'moving-entity', id, position, settingsIndex, baseSpriteIndex);

    }

    getInfo() {
        const info = super.getInfo();
        info.push(`energy: ${this.energy.toFixed(0)}/${this.maxEnergy}`);
        for (const trait of this.traits) {
            info.push(`trait: ${trait.name} (${trait.amount.toFixed(3)})`);
        }
        return info;
      }
}
