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
//   imageMap = loadImage('./static/map.png');
// }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background('black');
  translate(width * 0.5, height * 0.5);
  translate(-camera.x * camera.z, -camera.y * camera.z);
  scale(camera.z);
  if (imageMap) {
    image(imageMap, - sMap.settings.width * 0.5 * sMap.settings.scale, - sMap.settings.height * 0.5 * sMap.settings.scale, sMap.settings.width * sMap.settings.scale, sMap.settings.height * sMap.settings.scale);
  }

  if (sMap){
    for (property in sMap.chunkData){
      if (Object.hasOwnProperty(property)){
        let chunkData = property;
        image(chunkImages[i], chunkData.topX, chunkData.topY, chunkData.scale * chunkData.width, chunkData.height * chunkData.scale);
      }
    }
    if (sMap.vegetation) {
      for (let i = 0; i < sMap.vegetation.length; i++) {
        const entity = Object.assign(new Vegetation, sMap.vegetation[i]);
        entity.render(camera, spriteImages,sMap.vegetationSettings);
      }
    }
    if (sMap.people) {
      for (let i = 0; i < sMap.people.length; i++) {
        const entity = Object.assign(new Person, sMap.people[i]);
        entity.render(camera, spriteImages, sMap.peopleSettings)
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
  mapData = JSON.parse(mapData);
  console.log(mapData);
  sMap = Object.assign(new Map, mapData);
  loadImg = true;
});

socket.on('mapChunkAdd', function (chunkData) {
  sMap.chunkData[chunkData.name] = chunkData;
  print(chunkData);
  chunkImages.push(loadImage(chunkData.url));
});

socket.on('vegetation', (vegetationData) => {
  sMap.vegetation = vegetationData;
});

socket.on('people', (data) => {
  sMap.people = data;
});

socket.on('camera', (cameraData) => {
  camera.x = cameraData.x;
  camera.y = cameraData.y;
  camera.z = cameraData.z;
  console.log(camera);
});

socket.on('vegetationSettings', (vegetationSettings) => {
  sMap.vegetationSettings = vegetationSettings;
  console.log('revieved vegetation settings');
});
socket.on('error', (err) => {
  console.error(`server error: ${err}`);
});