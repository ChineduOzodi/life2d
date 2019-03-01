import { Camera } from './camera';
import { Position } from './position';
export class Entity {
    name: string;
    position: Position;
    settingsIndex: number;
    baseSpriteIndex: number;
    id: string;
    reserved = false;
    urlHead = 'http://localhost:5000';
    constructor(name: string, id: string, position: Position, settingsIndex: number, baseSpriteIndex: number) {
        this.name = name;
        this.position = position;
        this.settingsIndex = settingsIndex;
        this.baseSpriteIndex = baseSpriteIndex;
        this.id = id;
        this.reserved = false;
    }

    render(p: any, camera: Camera, spriteImages: {}, settingsList: []) {
        if (camera.zoomLevel > .15 &&
          camera.position.x + p.width * 0.5 / camera.zoomLevel > this.position.x &&
          camera.position.x - p.width * 0.5 / camera.zoomLevel < this.position.x &&
          camera.position.y + p.height * 0.5 / camera.zoomLevel > this.position.y &&
          camera.position.y - p.height * 0.5 / camera.zoomLevel < this.position.y
        ) {
          const entitySettings: any = settingsList[this.settingsIndex];
          const baseSprite = entitySettings.baseSprites[this.baseSpriteIndex];
          if (!spriteImages[`${baseSprite.url}`]) {
            console.log(`baseSprite: ${baseSprite.url[0]}`);
            let url = (baseSprite.url[0] === '/') ? this.urlHead + baseSprite.url : baseSprite.url;
            spriteImages[`${baseSprite.url}`] = p.loadImage(url);
          }
          if (camera.zoomLevel >= baseSprite.minZoom && camera.zoomLevel < baseSprite.maxZoom) {
            p.image(spriteImages[`${baseSprite.url}`],
              this.position.x - baseSprite.offsets.x * baseSprite.scale * baseSprite.width,
              this.position.y - baseSprite.offsets.y * baseSprite.scale * baseSprite.height,
              baseSprite.width * baseSprite.scale,
              baseSprite.height * baseSprite.scale
            );
          } else {
            // check for conditional sprites
            if (baseSprite.otherSpritesIndex && baseSprite.otherSpritesIndex.length > 0) {
              for (let s = 0; s < baseSprite.otherSpritesIndex.length; s++) {
                const otherSpriteIndex = baseSprite.otherSpritesIndex[s];
                const otherSprite = entitySettings.otherSprites[otherSpriteIndex];
                if (!spriteImages[`${otherSprite.url}`]) {
                  let url = (otherSprite.url[0] === '/') ? this.urlHead + otherSprite.url : otherSprite.url;
                  spriteImages[`${otherSprite.url}`] = p.loadImage(url);
                }

                if (camera.zoomLevel >= otherSprite.minZoom && camera.zoomLevel < otherSprite.maxZoom) {
                    p.image(spriteImages[`${otherSprite.url}`],
                    this.position.x - otherSprite.offsets.x * otherSprite.scale,
                    this.position.y - otherSprite.offsets.y * otherSprite.scale,
                    otherSprite.width * otherSprite.scale,
                    otherSprite.height * otherSprite.scale
                  );
                    break;
                }
              }
            }
          }
        }
      }
}
