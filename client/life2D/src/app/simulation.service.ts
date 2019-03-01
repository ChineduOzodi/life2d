import { Camera } from './simulation/classes/camera';
import { Socket } from 'ngx-socket-io';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  error = this.socket.fromEvent('error');
  constructor(private socket: Socket) { }

  sendCamera(camera: Camera){
    this.socket.emit('camera', camera);
  }
}
