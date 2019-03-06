import { Position } from './position';
export class LocationReserve {

    position: Position;
    width: number;
    height: number;
    entityId: string;

    constructor(position: Position ,width: number,height: number ,entityId: string) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.entityId = entityId;
    }
}
