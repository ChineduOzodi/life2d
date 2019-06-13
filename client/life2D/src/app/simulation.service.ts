import { LocationReserve } from './simulation/classes/location-reserve';
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
  entities = this.socket.fromEvent<any[]>('entities');
  locationReservations = this.socket.fromEvent<LocationReserve[]>('locationReservations');
  goapActions = this.socket.fromEvent<any[]>('goapActions');
  constructor(private socket: Socket) { }

  sendCamera(camera: Camera) {
    this.socket.emit('camera', camera);
  }

  setGoal(goal: string) {
    this.socket.emit('setPersonGoal', goal);
  }
}
