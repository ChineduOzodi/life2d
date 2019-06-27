import { Camera } from './camera';
import { Position } from './position';
export class Entity {
  name: string;
  type: string;
  age = 0;
  info = '';
  position: Position;
  settingsIndex: number;
  baseSpriteIndex: number;
  generation: number;
  health: number;
  healthLossRate: number;
  baseHealthLossRate: number;
  id: string;
  traits = [];
  reserved = false;
  destroy = false;
  urlHead = 'http://localhost:5000';
  constructor(name: string, type: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
    this.name = name;
    this.type = type;
    this.position = position;
    this.settingsIndex = settingsIndex;
    this.baseSpriteIndex = baseSpriteIndex;
    this.id = id;
    this.reserved = false;
  }

  getWindowPosition(camera: Camera): Position {
    const wX = this.position.x - camera.position.x * camera.zoomLevel;
    const wY = this.position.y - camera.position.y * camera.zoomLevel;
    return new Position(wX, wY, 0);
  }

  render(p: any, camera: Camera, spriteImages: {}, settingsList: []) {
    if (!this.destroy) {
      // console.log('rendering entity');
      if (camera.zoomLevel > .15 &&
        camera.position.x + p.width * 0.5 / camera.zoomLevel > this.position.x &&
        camera.position.x - p.width * 0.5 / camera.zoomLevel < this.position.x &&
        camera.position.y + p.height * 0.5 / camera.zoomLevel > this.position.y &&
        camera.position.y - p.height * 0.5 / camera.zoomLevel < this.position.y
      ) {
        const entitySettings: any = settingsList[this.settingsIndex];
        const baseSprite = entitySettings.baseSprites[this.baseSpriteIndex];
        if (!spriteImages[`${baseSprite.url}`]) {
          // console.log(`baseSprite: ${baseSprite.url[0]}`);
          const url = (baseSprite.url[0] === '/') ? this.urlHead + baseSprite.url : baseSprite.url;
          // console.log(`url: ${url}, baseSpriteUrl: ${baseSprite.url}, urlHead: ${this.urlHead}`);
          spriteImages[`${baseSprite.url}`] = p.loadImage(url);
        }
        if (camera.zoomLevel >= baseSprite.minZoom && camera.zoomLevel < baseSprite.maxZoom) {
          const adj = baseSprite.scale / baseSprite.width;
          p.image(spriteImages[`${baseSprite.url}`],
            this.position.x - baseSprite.offsets.x * adj * baseSprite.width,
            this.position.y - baseSprite.offsets.y * adj * baseSprite.height,
            baseSprite.width * adj,
            baseSprite.height * adj
          );
        } else {
          // check for conditional sprites
          if (baseSprite.otherSpritesIndex && baseSprite.otherSpritesIndex.length > 0) {
            for (const otherSpriteIndex of baseSprite.otherSpritesIndex) {
              const otherSprite = entitySettings.otherSprites[otherSpriteIndex];
              if (!spriteImages[`${otherSprite.url}`]) {
                const url = (otherSprite.url[0] === '/') ? this.urlHead + otherSprite.url : otherSprite.url;
                spriteImages[`${otherSprite.url}`] = p.loadImage(url);
              }
              const adj = otherSprite.scale / otherSprite.width;
              if (camera.zoomLevel >= otherSprite.minZoom && camera.zoomLevel < otherSprite.maxZoom) {
                p.image(spriteImages[`${otherSprite.url}`],
                  this.position.x - otherSprite.offsets.x * adj,
                  this.position.y - otherSprite.offsets.y * adj,
                  otherSprite.width * adj,
                  otherSprite.height * adj
                );
                break;
              }
            }
          }
        }
      }
    }
  }

  getInfo() {
    const info = [`name: ${this.name}`,
                  `type: ${this.type}`,
                  `id: ${this.id}`,
                  `age: ${this.age.toFixed(0)}`,
                  `health: ${this.health.toFixed(0)}`,
                  `generation: ${this.generation}`,
                  `position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`];
    if (this.info){
      info.push(`info: ${this.info}`);
    }
    return info;
  }
}
