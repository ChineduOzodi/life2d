import { Map } from './simulation/interfaces/map';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  data = [
    {
      data: [0],
      label: 'Vegetation'
    }
  ];
  label = ['0'];

  interval = 5 * 60;
  currentLatestTime = 5 * 60;
  currentIndex = 0;

  constructor() { }

  updateData(map: Map) {
    let totalEntities = 0;
    for (const entity of map.entities) {
      if (!entity.destroy) {
        totalEntities++;
      }
    }

    if (map.time > this.currentLatestTime) {
      this.currentIndex++;
      this.currentLatestTime += this.interval;
      this.data[0].data.push(0);
      this.label.push(`${(this.currentLatestTime / 60).toFixed(1)} m`);
    }

    this.data[0].data[this.currentIndex] = totalEntities;
  }
}
