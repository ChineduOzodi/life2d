import { Injectable } from '@angular/core';
import { User } from './user';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  userEvent = this.socket.fromEvent<User>('user');
  private user: User;
  constructor(private socket: Socket) { }

  login(username: string) {
    this.socket.emit('login', username);
  }

  setUser(user: User) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }
}
