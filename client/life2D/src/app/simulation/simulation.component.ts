import { LoginService } from './../login.service';
import { Camera } from './classes/camera';
import { Movement } from './classes/movement';
import { Component, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
// import { NGXLogger } from 'ngx-logger';
import * as p5 from 'p5';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, AfterViewInit {

  @ViewChild('simulationConatiner') elementView;
  
  width: number;
  movement = new Movement();
  camera: Camera;
  constructor(
    private loginService: LoginService,
    // private logger: NGXLogger
  ) { }

  ngOnInit() {
    this.camera = this.loginService.getUser().camera;
    // this.logger.debug('camera set', this.camera);
   }

  ngAfterViewInit() {
    console.log(this.elementView.nativeElement.clientWidth);
    this.width = this.elementView.nativeElement.clientWidth;
    this.createCanvas();
  }

  createCanvas() {
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
      p.resizeCanvas(p.windowWidth * 0.8, p.windowHeight);
    }
  }

  @HostListener('document:keydown', ['$event']) onKeyDown(event: any) {
    switch (event.keyCode) {
      case 65: // A
        this.movement.left = true;
        break;
      case 87: // W
        this.movement.up = true;
        break;
      case 68: // D
        this.movement.right = true;
        break;
      case 83: // S
        this.movement.down = true;
        break;
    }
  }

  @HostListener('document:keyup', ['$event'])onKeyUp(event: any) {
    switch (event.keyCode) {
      case 65: // A
        this.movement.left = false;
        break;
      case 87: // W
        this.movement.up = false;
        break;
      case 68: // D
        this.movement.right = false;
        break;
      case 83: // S
        this.movement.down = false;
        break;
    }
  }
}
