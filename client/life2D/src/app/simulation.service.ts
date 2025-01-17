import { Entity } from './simulation/classes/entity';
import { LocationReserve } from './simulation/classes/location-reserve';
import { Person } from './simulation/classes/person';
import { Vegetation } from './simulation/classes/vegetation';
import { Map } from './simulation/interfaces/map';
import { Camera } from './simulation/classes/camera';
import { Socket } from 'ngx-socket-io';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  error = this.socket.fromEvent<string>('error');
  map = this.socket.fromEvent<Map>('map');
  chunkData = this.socket.fromEvent<any>('mapChunkAdd');
  vegetation = this.socket.fromEvent<Vegetation[]>('vegetation');
  people = this.socket.fromEvent<Person[]>('people');
  locationReservations = this.socket.fromEvent<LocationReserve[]>('locationReservations');
  others = this.socket.fromEvent<Entity[]>('updateOthers');
  goapActions = this.socket.fromEvent<any[]>('goapActions');
  constructor(private socket: Socket) { }

  sendCamera(camera: Camera) {
    this.socket.emit('camera', camera);
  }

  setGoal(goal: string) {
    this.socket.emit('setPersonGoal', goal);
  }
}
