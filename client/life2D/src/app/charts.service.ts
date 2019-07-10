import { Map } from './simulation/interfaces/map';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  data = this.socket.fromEvent<any[]>('data');

  constructor(private socket: Socket) { }

}
