import { MovingEntity } from './classes/moving-entity';
import { Map } from './interfaces/map';
import { Subscription } from 'rxjs';
import { Vegetation } from './classes/vegetation';
import { SimulationService } from './../simulation.service';
import { LoginService } from './../login.service';
import { Camera } from './classes/camera';
import { Movement } from './classes/movement';
import { Component, OnInit, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
// import { NGXLogger } from 'ngx-logger';
import * as p5 from 'p5';
import { Position } from './classes/position';
import { Entity } from './classes/entity';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, AfterViewInit, OnDestroy {
  debug = false;
  urlHead = 'http://localhost:5000';
  @ViewChild('simulationConatiner') elementView;
  p5: any;
  width: number;
  movement = new Movement();
  camera: Camera;
  sMap: Map;
  actions: any[];
  chunkImages = {};
  spriteImages = {};
  imageMap: any;
  loadImg: boolean;
  energyPercentString: string;
  staminaPercentString: string;
  fullnessPercentString: string;
  mapSub: Subscription;
  mapChunkAddSub: Subscription;
  mapEntitiesSub: Subscription;
  locationReservationsSub: Subscription;
  goapActionsSub: Subscription;
  constructor(
    private loginService: LoginService,
    private simulationService: SimulationService
    // private logger: NGXLogger
  ) { }

  ngOnInit() {
    this.camera = Object.assign( new Camera(new Position(0, 0, 0), 1), this.loginService.getUser().camera);
    this.mapSub = this.simulationService.map.subscribe(map => {
      console.log(`recieved map`);
      this.sMap = map;
      this.loadImg = true;
    });
    this.mapChunkAddSub = this.simulationService.chunkData.subscribe(chunkData => {
      this.sMap.chunkData[chunkData.name] = chunkData;
      console.log(chunkData);
    });
    this.mapEntitiesSub = this.simulationService.entities.subscribe(entities => {
      this.sMap.entities = entities;
    });
    this.locationReservationsSub = this.simulationService.locationReservations.subscribe( reservations => {
      this.sMap.locationReservations = reservations;
      console.log('location reservations updated');
    });
    this.goapActionsSub = this.simulationService.goapActions.subscribe( actions => {
      console.log('received actions');
      console.log(actions);
      this.actions = actions;
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
    this.p5.sim = this;
    // console.log(`create sim: ${this.p5.sim}`);
  }

  private sketch(p: any) {
    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth * 0.8, p.windowHeight);
      cnv.parent('simulationContainer');
    };

    p.draw = () => {
      if (p.sim) {
        p.background('black');
        p.translate(p.width * 0.5, p.height * 0.5);
        // console.log(`sim: ${p.sim}`);
        p.translate(-p.sim.camera.position.x * p.sim.camera.zoomLevel, -p.sim.camera.position.y * p.sim.camera.zoomLevel);
        p.scale(p.sim.camera.zoomLevel);
        if (p.sim.imageMap) {
          p.image(p.sim.imageMap, - p.sim.sMap.settings.width * 0.5 * p.sim.sMap.settings.scale,
            - p.sim.sMap.settings.height * 0.5 * p.sim.sMap.settings.scale,
            p.sim.sMap.settings.width * p.sim.sMap.settings.scale, p.sim.sMap.settings.height * p.sim.sMap.settings.scale);
        }
        try {
          if (p.sim.sMap) {
            for (const property in p.sim.sMap.chunkData) {
              if (p.sim.sMap.chunkData.hasOwnProperty(property)) {
                const chunkData = p.sim.sMap.chunkData[property];
                // console.log(chunkData.imageIndex);
                if (p.sim.chunkImages[chunkData.name]) {
                  p.image(p.sim.chunkImages[chunkData.name], chunkData.topX, chunkData.topY,
                    chunkData.scale * chunkData.width, chunkData.height * chunkData.scale);
                } else {
                  p.sim.chunkImages[chunkData.name] = p.loadImage(p.sim.urlHead + chunkData.url);
                  p.image(p.sim.chunkImages[chunkData.name], chunkData.topX, chunkData.topY,
                    chunkData.scale * chunkData.width, chunkData.height * chunkData.scale);
                }
              }
            }
            if (p.sim.sMap.entities) {
              for (const entity of p.sim.sMap.entities) {
                const spawnIndex = p.sim.sMap.entitySettings.findIndex(x => x.type === entity.type);
                const spawnSettings = p.sim.sMap.entitySettings[spawnIndex];
                let entityA = null;
                if (spawnSettings.type === 'vegetation') {
                  entityA = Object.assign(new Vegetation('', '', new Position(0, 0, 0), 0, 0), entity);
                } else if (spawnSettings.type === 'herbivore') {
                  entityA = Object.assign(new MovingEntity('', new Position(0, 0, 0), 0, 0), entity);
                } else {
                  console.error(`Type not sure for: ${entity.name}`);
                  entityA = Object.assign(new Entity('', '', new Position(0, 0, 0), 0, 0), entity);
                }
                entityA.render(p, p.sim.camera, p.sim.spriteImages, p.sim.sMap.entitySettings);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
        p.noStroke();
        p.fill(p.color(255, 100, 100, 100));
        p.ellipse(p.sim.camera.position.x, p.sim.camera.position.y, 10 / p.sim.camera.zoomLevel);
        if (p.sim.loadImg) {
          p.sim.loadImg = false;
          p.sim.imageMap = p.loadImage(`${p.sim.urlHead}/static/map.png`);
          if (p.sim.sMap.chunkData) {
            for (const property in p.sim.sMap.chunkData) {
              if (p.sim.sMap.chunkData.hasOwnProperty(property)) {
                const chunkData = p.sim.sMap.chunkData[property];
                // console.log(chunkData);

                p.sim.chunkImages[chunkData.name] = p.loadImage(p.sim.urlHead + chunkData.url);
              }
            }
          }
          console.log('image(s) loaded');
        }
        // print(`x: ${p.sim.camera.position.x}, y: ${p.sim.camera.position.y}, zoom: ${p.sim.camera.zoomLevel}`);
        p.sim.moveCamera();
      }
    };

    p.mouseWheel = (event: any) => {
      p.sim.camera.zoom(event.delta, p.mouseX, p.mouseY, p.width, p.height);
      p.sim.simulationService.sendCamera(p.sim.camera);
      // console.log(`z: ${camera.z}`);
      // uncomment to block page scrolling
      return false;
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth * 0.8, p.windowHeight);
    };
  }
  toggleDebug() {
    this.debug = !this.debug;
  }
  moveCamera() {
    if (this.camera.translate(this.movement)) {
      // console.log(this.camera);
      this.simulationService.sendCamera(this.camera);
    }
  }

  setGoal(name) {
    this.simulationService.setGoal(name);
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
