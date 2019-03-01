import { Position } from './position';
export class Entity {
    name: string;
    position: Position;
    settingsIndex: number;
    baseSpriteIndex: number;
    id: string;
    reserved = false;

    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        this.name = name;
        this.position = position;
        this.settingsIndex = settingsIndex;
        this.baseSpriteIndex = baseSpriteIndex;
        this.id = id;
        this.reserved = false;
    }
}
