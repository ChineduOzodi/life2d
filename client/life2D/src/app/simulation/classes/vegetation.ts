import { Position } from './position';
import { Entity } from './entity';
export class Vegetation extends Entity {
    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        super(name, id, position, settingsIndex, baseSpriteIndex);
    }
}
