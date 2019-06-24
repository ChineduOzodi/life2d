import { Map } from './simulation/interfaces/map';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  update;

  constructor() { }

  callUpdateData() {
    this.update();
  }
}
