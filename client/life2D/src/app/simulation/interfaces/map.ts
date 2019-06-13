import { LocationReserve } from './../classes/location-reserve';
export interface Map {
    id: string;
    name: string;
    width: number;
    height: number;
    scale: number;
    settings: any;
    entitySettings: any;
    pendingChunks: any[];
    entities: any[];
    chunkData: {};
    map: {};
    locationReservations: LocationReserve[];
}
