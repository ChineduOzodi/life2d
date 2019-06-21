import { Position } from './position';
import { Entity } from './entity';
export class Vegetation extends Entity {
    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super(name, 'vegetation', id, position, settingsIndex, baseSpriteIndex);
    }
}
