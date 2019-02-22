var maptiles;
var canDraw = false;
var loadImg;
var sMap;
var chunksJson = [];
var chunkImages = [];
var spriteImages = {};
var imageMap;
var camera;

function setup() {
  createCanvas(windowWidth, windowHeight);
  camera = new Camera(0, 0, 1);
  noStroke();
  camera.z = 1;
}

// function preload() {
//   map = loadImage('./static/map.png');
// }

// function windowResized() {
//   //resizeCanvas(windowWidth, windowHeight);
// }

function draw() {
  background('black');
  translate(width * 0.5, height * 0.5);
  translate(-camera.x * camera.z, -camera.y * camera.z);
  scale(camera.z);
  if (imageMap) {
    image(imageMap, - sMap.settings.width * 0.5 * sMap.settings.scale, - sMap.settings.height * 0.5 * sMap.settings.scale, sMap.settings.width * sMap.settings.scale, sMap.settings.height * sMap.settings.scale);
  }
  for (let i = 0; i < chunksJson.length; i++) {
    const chunkData = chunksJson[i];
    image(chunkImages[i], chunkData.topX, chunkData.topY, chunkData.scale * chunkData.width, chunkData.height * chunkData.scale);
  }
  if (sMap && sMap.vegetation) {
    for (let i = 0; i < sMap.vegetation.length; i++) {
      const veg = sMap.vegetation[i];
      // sMap.vegetationSettings[veg.vegSettingsIndex].
      if (camera.z > .15 &&
        camera.x + width * 0.5 / camera.z > veg.x &&
        camera.x - width * 0.5/ camera.z < veg.x &&
        camera.y + height * 0.5/ camera.z > veg.y &&
        camera.y - height * 0.5/ camera.z < veg.y
      ) {
        let vegSettings = sMap.vegetationSettings[veg.vegSettingsIndex];
        let baseSprite = vegSettings.baseSprites[veg.baseSpriteIndex];
        if (!spriteImages[`${baseSprite.url}`]) {
          spriteImages[`${baseSprite.url}`] = loadImage(baseSprite.url);
        }
        if (camera.z >= baseSprite.minZoom && camera.z < baseSprite.maxZoom) {
          image(spriteImages[`${baseSprite.url}`],
            veg.x - baseSprite.offsets.x * baseSprite.scale,
            veg.y - baseSprite.offsets.y * baseSprite.scale,
            baseSprite.width * baseSprite.scale,
            baseSprite.height * baseSprite.scale
          );
        } else {
          //check for conditional sprites
          if (baseSprite.otherSpritesIndex && baseSprite.otherSpritesIndex.length > 0) {
            for (let s = 0; s < baseSprite.otherSpritesIndex.length; s++) {
              const otherSpriteIndex = baseSprite.otherSpritesIndex[s];
              let otherSprite = vegSettings.otherSprites[otherSpriteIndex];
              if (!spriteImages[`${otherSprite.url}`]) {
                spriteImages[`${otherSprite.url}`] = loadImage(otherSprite.url);
              }

              if (camera.z >= otherSprite.minZoom && camera.z < otherSprite.maxZoom) {
                image(spriteImages[`${otherSprite.url}`],
                  veg.x - otherSprite.offsets.x * otherSprite.scale,
                  veg.y - otherSprite.offsets.y * otherSprite.scale,
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
  fill(color(255, 100, 100, 100));
  ellipse(camera.x, camera.y, 10 / camera.z);
  if (loadImg) {
    loadImg = false;
    imageMap = loadImage('./static/map.png');
    console.log('image loaded');
  }
  // print(`x: ${camera.x}, y: ${camera.y}, zoom: ${camera.z}`);
  moveCamera();
}

function mouseWheel(event) {
  camera.zoom(event.delta, mouseX, mouseY, width, height);
  socket.emit('camera', camera);
  // console.log(`z: ${camera.z}`);
  //uncomment to block page scrolling
  //return false;
}

function moveCamera() {
  if (camera.translate(movement)) {
    socket.emit('camera', camera);
  }
}

socket.on('map', function (mapData) {
  sMap = JSON.parse(mapData);
  console.log(mapData);
  sMap = new Map(sMap.settings);
  loadImg = true;
  // width = w;
  // height = h;
  // maptiles = tiles;
  // console.log(map);
  // console.log(width);
  // console.log(height);
});

socket.on('mapChunkAdd', function (chunkData) {
  chunksJson.push(chunkData);
  print(chunkData);
  chunkImages.push(loadImage(chunkData.url));
});

socket.on('vegetation', (vegetationData) => {
  sMap.vegetation = vegetationData;
});

socket.on('vegetationSettings', (vegetationSettings) => {
  sMap.vegetationSettings = vegetationSettings;
  console.log('revieved vegetation settings');
});