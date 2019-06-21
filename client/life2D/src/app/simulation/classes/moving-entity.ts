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

    getInfo() {
        const info = [`name: ${this.name}`,
                    `type: ${this.type}`,
                    `id: ${this.id}`,
                    `energy: ${this.energy.toFixed(0)}/${this.maxEnergy}`,
                    `position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`,
                    `info: ${this.info}`];
        for (const trait of this.traits) {
            info.push(`trait: ${trait.name} (${trait.amount.toFixed(3)})`);
        }
        return info;
      }
}
