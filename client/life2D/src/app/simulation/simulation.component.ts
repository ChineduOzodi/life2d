import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import * as p5 from 'p5';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, AfterViewInit {

  @ViewChild('simulationConatiner') elementView;
  width: number;
  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log(this.elementView.nativeElement.clientWidth);
    this.width = this.elementView.nativeElement.clientWidth;
    this.createCanvas();
  }

  createCanvas(){
    new p5(this.sketch);
  }

  private sketch(p: any) {
    p.setup = () => {
      let cnv = p.createCanvas(p.windowWidth * 0.8, p.windowHeight);
      cnv.parent('simulationContainer');
    };
  
    p.draw = () => {
      p.background(p.color('yellow'));
      p.fill(0);
      p.rect(p.width / 2 - 25, p.height / 2 - 25, 50, 50);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
  }

}
