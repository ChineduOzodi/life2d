var maptiles;
var canDraw = false;
var loadImg;
var sMap;
var imageMap;
var camera;

function setup() {
  createCanvas(windowWidth, windowHeight);
  camera = new Camera(0,0,1);
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
  translate(width/2,height/2);
  translate(-camera.x * camera.z, -camera.y * camera.z);
  scale(camera.z);
  if (imageMap) {
    image(imageMap, - sMap.settings.width / 2 * sMap.settings.scale, - sMap.settings.height / 2 * sMap.settings.scale,sMap.settings.width * sMap.settings.scale,sMap.settings.height * sMap.settings.scale);
  }
  if (loadImg) {
    loadImg = false;
    imageMap = loadImage('./static/map.png');
    console.log('image loaded');
  }
  // print(`x: ${camera.x}, y: ${camera.y}, zoom: ${camera.z}`);
  moveCamera();
}

function mouseWheel(event) {
  camera.zoom(event.delta,mouseX,mouseY,width,height);
  socket.emit('camera', camera);
  //uncomment to block page scrolling
  //return false;
}

function moveCamera() {
 if (camera.translate(movement)) {
   socket.emit('camera', camera);
 };
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