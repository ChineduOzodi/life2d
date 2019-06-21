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

    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super(name, 'moving-entity', id, position, settingsIndex, baseSpriteIndex);

    }

    toString() {
        let info = `name: ${this.name}\n
        type: ${this.type}\n
        id: ${this.id}\n
        energy: ${this.energy}/${this.maxEnergy}\n
        position: (${this.position.x}, ${this.position.y})\n
        info: ${this.info}\n`;
        for (const trait of this.traits) {
            info += `trait: ${trait.name} (${trait.amount})\n`;
        }
        return info;
      }
}
