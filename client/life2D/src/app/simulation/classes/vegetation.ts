import { Position } from './position';
import { Entity } from './entity';
export class Vegetation extends Entity {
    duplicate: number;

    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super(name, 'vegetation', id, position, settingsIndex, baseSpriteIndex);
    }

    getInfo() {
        const info = super.getInfo();
        // info.push(JSON.stringify(this));
        info.push(`health loss: ${this.healthLossRate.toFixed(1)}`);
        info.push(`duplicate: ${this.duplicate.toFixed(1)}`);
        for (const trait of this.traits) {
            info.push(`trait: ${trait.name} (${trait.amount.toFixed(3)})`);
        }
        return info;
    }
}
