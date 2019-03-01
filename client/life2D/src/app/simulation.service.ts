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
  chunkData = this.socket.fromEvent('mapAddChunk');
  vegetation = this.socket.fromEvent<Vegetation[]>('vegetation');
  people = this.socket.fromEvent<Person[]>('people');
  
  constructor(private socket: Socket) { }

  sendCamera(camera: Camera) {
    this.socket.emit('camera', camera);
  }
}
