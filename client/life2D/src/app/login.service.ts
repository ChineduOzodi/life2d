import { Injectable } from '@angular/core';
import { User } from './user';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  user = this.socket.fromEvent<User>('user');
  constructor(private socket: Socket) { }

  login(username: string) {
    this.socket.emit('login', username);
  }
}
