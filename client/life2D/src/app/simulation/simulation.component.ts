import { Map } from './interfaces/map';
import { Subscription } from 'rxjs';
import { Vegetation } from './classes/vegetation';
import { Person } from './classes/person';
import { SimulationService } from './../simulation.service';
import { LoginService } from './../login.service';
import { Camera } from './classes/camera';
import { Movement } from './classes/movement';
import { Component, OnInit, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
// import { NGXLogger } from 'ngx-logger';
import * as p5 from 'p5';
import { Position } from './classes/position';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('simulationConatiner') elementView;
  p5: any;
  width: number;
  movement = new Movement();
  camera: Camera;
  loadImg: boolean;
  sMap: Map;
  chunkImages = {};
  spriteImages = {};
  imageMap: any;
  mapSub: Subscription;
  constructor(
    private loginService: LoginService,
    private simulationService: SimulationService
    // private logger: NGXLogger
  ) { }

  ngOnInit() {
    this.camera = this.loginService.getUser().camera;
    this.mapSub = this.simulationService.map.subscribe( map => {
      console.log(`recieved map`);
      this.sMap = map;
      this.loadImg = true;
    });
    // this.logger.debug('camera set', this.camera);
  }

  ngOnDestroy() {
    this.mapSub.unsubscribe();
  }

  ngAfterViewInit() {
    console.log(this.elementView.nativeElement.clientWidth);
    this.width = this.elementView.nativeElement.clientWidth;
    this.createCanvas();
  }

  createCanvas() {
    this.p5 = new p5(this.sketch);
  }

  private sketch(p: any) {
    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth * 0.8, p.windowHeight);
      cnv.parent('simulationContainer');
    };

    p.draw = () => {
      p.background('black');
      p.translate(p.width * 0.5, p.height * 0.5);
      p.translate(-this.camera.position.x * this.camera.position.z, -this.camera.position.y * this.camera.position.z);
      p.scale(this.camera.position.z);
      if (this.imageMap) {
        p.image(this.imageMap, - this.sMap.settings.width * 0.5 * this.sMap.settings.scale,
           - this.sMap.settings.height * 0.5 * this.sMap.settings.scale,
           this.sMap.settings.width * this.sMap.settings.scale, this.sMap.settings.height * this.sMap.settings.scale);
      }
      try {
        if (this.sMap) {
          for (const property in this.sMap.chunkData) {
            if (this.sMap.chunkData.hasOwnProperty(property)) {
              const chunkData = this.sMap.chunkData[property];
              // console.log(chunkData.imageIndex);
              p.image(this.chunkImages[chunkData.name], chunkData.topX, chunkData.topY,
                chunkData.scale * chunkData.width, chunkData.height * chunkData.scale);
            }
          }
          if (this.sMap.vegetation) {
            for (const vegetation of this.sMap.vegetation) {
              // const entity: Vegetation = Object.assign(new Vegetation('','',new Position(0,0,0),0,0), vegetation);
              vegetation.render(p, this.camera, this.spriteImages, this.sMap.vegetationSettings);
            }
          }
          if (this.sMap.people) {
            for (const person of this.sMap.people) {
              // const entity: Person = Object.assign(new Person('', new Position(0,0,0),0,0,0), person);
              person.render(p, this.camera, this.spriteImages, this.sMap.peopleSettings);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
      p.fill(p.color(255, 100, 100, 100));
      p.ellipse(this.camera.position.x, this.camera.position.y, 10 / this.camera.position.z);
      if (this.loadImg) {
        this.loadImg = false;
        this.imageMap = p.loadImage('./static/map.png');
        if (this.sMap.chunkData) {
          for (const property in this.sMap.chunkData) {
            if (this.sMap.chunkData.hasOwnProperty(property)) {
              let chunkData = this.sMap.chunkData[property];
              // console.log(chunkData);
              this.chunkImages[chunkData.name] = p.loadImage(chunkData.url);
            }
          }
        }
        console.log('image(s) loaded');
      }
      // print(`x: ${this.camera.position.x}, y: ${this.camera.position.y}, zoom: ${this.camera.position.z}`);
      this.moveCamera();
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth * 0.8, p.windowHeight);
    };
  }

  moveCamera() {
    if (this.camera.translate(this.movement)) {
      this.simulationService.sendCamera(this.camera);
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

  @HostListener('document:keyup', ['$event']) onKeyUp(event: any) {
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
