function Entity(id, x, y, settingsIndex, baseSpriteIndex) {
  this.position = createVector(x, y);
  this.settingsIndex = settingsIndex;
  this.baseSpriteIndex = baseSpriteIndex;
  this.id = id;
  this.reserved = false;
}

Entity.prototype.render = function (camera, spriteImages, settingsList) {
  if (camera.z > .15 &&
    camera.x + width * 0.5 / camera.z > this.position.x &&
    camera.x - width * 0.5 / camera.z < this.position.x &&
    camera.y + height * 0.5 / camera.z > this.position.y &&
    camera.y - height * 0.5 / camera.z < this.position.y
  ) {
    let entitySettings = settingsList[this.settingsIndex];
    let baseSprite = entitySettings.baseSprites[this.baseSpriteIndex];
    if (!spriteImages[`${baseSprite.url}`]) {
      spriteImages[`${baseSprite.url}`] = loadImage(baseSprite.url);
    }
    if (camera.z >= baseSprite.minZoom && camera.z < baseSprite.maxZoom) {
      image(spriteImages[`${baseSprite.url}`],
        this.position.x - baseSprite.offsets.x * baseSprite.scale * baseSprite.width,
        this.position.y - baseSprite.offsets.y * baseSprite.scale * baseSprite.height,
        baseSprite.width * baseSprite.scale,
        baseSprite.height * baseSprite.scale
      );
    } else {
      //check for conditional sprites
      if (baseSprite.otherSpritesIndex && baseSprite.otherSpritesIndex.length > 0) {
        for (let s = 0; s < baseSprite.otherSpritesIndex.length; s++) {
          const otherSpriteIndex = baseSprite.otherSpritesIndex[s];
          let otherSprite = entitySettings.otherSprites[otherSpriteIndex];
          if (!spriteImages[`${otherSprite.url}`]) {
            spriteImages[`${otherSprite.url}`] = loadImage(otherSprite.url);
          }

          if (camera.z >= otherSprite.minZoom && camera.z < otherSprite.maxZoom) {
            image(spriteImages[`${otherSprite.url}`],
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