var maptiles;
var mWidth;
var mHeight;
var canDraw =false;
var s;
var loadImg;
var map;

var cameraSpeed = 1;
var cameraZoomZEffect = 0.5;
var cameraZoomSpeed = 1.0;

var cameraX = 0;
var cameraY = 0;
var cameraZ;

function setup() {
  mWidth = 200;
  s = 1;
  mHeight = 200;
  createCanvas(mWidth * s, mHeight * s);
  background('black');
  noStroke();
  cameraZ = (height/2.0) / tan(PI*30.0 / 180.0);
}

function preload() {
  map = loadImage('./static/map.png');
}

function draw() {
  if (map) {
    image(map, 0, 0, width, height);
  }
  if (loadImg) {
    loadImg =false;
    map = loadImage('./static/map.png');
    console.log('image loaded');
  }
  moveCamera();
  translate(cameraX,cameraY);
  scale(cameraZ);
  //draw map
  // if (canDraw){
  //   //console.log(maptiles);
  //   maptiles.forEach(tile => {
  //     if (typeof(tile.color) == "string") {
  //       fill(tile.color);
  //       //console.log(tile.color);
  //     }
  //     else{
  //       fill(tile.color[0],tile.color[1],tile.color[2]);
  //     }
  //     rect(tile.x * s - s * 0.5, tile.y * s - s * 0.5, s, s);
  //     //console.log(`x: ${tile.x * s - s * 0.5}, y: ${tile.y * s - s * 0.5, s}, s: ${s}`);
  //   });
  // }
}

function mouseWheel(event) {
  //move the square according to the vertical scroll amount
  cameraZ += cameraZoomSpeed * event.delta * Math.pow(cameraZ,cameraZoomZEffect);
  //uncomment to block page scrolling
  //return false;
}

function moveCamera() {
  if (movement.up) {
    cameraY -= Math.pow(cameraSpeed, cameraZ);
  }
  if (movement.down) {
    cameraY += Math.pow(cameraSpeed, cameraZ);
  }
  if (movement.left) {
    cameraX -= Math.pow(cameraSpeed, cameraZ);
  }
  if (movement.right) {
    cameraX += Math.pow(cameraSpeed, cameraZ);
  }
}

socket.on('map', function () {
  loadImg = true;
  // canDraw = true;
  // width = w;
  // height = h;
  // maptiles = tiles;
  // console.log(map);
  // console.log(width);
  // console.log(height);
});