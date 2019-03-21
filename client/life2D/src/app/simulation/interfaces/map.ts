import { Entity } from './../classes/entity';
import { LocationReserve } from './../classes/location-reserve';
import { Vegetation } from './../classes/vegetation';
import { Person } from './../classes/person';
export interface Map {
    id: string;
    name: string;
    width: number;
    height: number;
    scale: number;
    settings: any;
    vegetationSettings: any;
    peopleSettings: any;
    pendingChunks: any[];
    vegetation: Vegetation[];
    people: Person[];
    others: Entity[];
    chunkData: {};
    map: {};
    locationReservations: LocationReserve[];
}
