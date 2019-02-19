var maptiles;
var mWidth;
var mHeight;
var canDraw = false;
var s;
var loadImg;
var map;

var cameraSpeed = 1;
var cameraZoomZEffect = 0.5;
var cameraZoomSpeed = .001;

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
  cameraZ = 1;
}

function preload() {
  map = loadImage('./static/map.png');
}

function draw() {
  background('black');
  translate(width/2,mHeight/2);
  translate(-cameraX * cameraZ, -cameraY * cameraZ);
  scale(cameraZ);
  if (map) {
    image(map, 0, 0);
  }
  if (loadImg) {
    loadImg = false;
    map = loadImage('./static/map.png');
    console.log('image loaded');
  }
  // print(`x: ${cameraX}, y: ${cameraY}, zoom: ${cameraZ}`);
  moveCamera();
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
  // print(`x: ${cameraX}, y: ${cameraY}, zoom: ${cameraZ}`);
  var newZoom =cameraZ + cameraZoomSpeed * event.delta * cameraZ;
  var dx = mouseX - width / 2;
  var dy = mouseY - height / 2;
  // print(`new zoom: ${newZoom}, dx: ${dx}, dy: ${dy}, mouseX: ${mouseX}, mouseY: ${mouseY}`);
  cameraX += dx/cameraZ - dx/newZoom;
  cameraY +=dy/cameraZ - dy/newZoom;
  cameraZ = newZoom;
  // print(`new x: ${cameraX}, y: ${cameraY}, zoom: ${cameraZ}`);
  cameraZ = Math.max(.1, cameraZ);
  cameraZ = Math.min(10, cameraZ);
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
  cameraY = Math.max(cameraY,0);
  cameraY = Math.min(cameraY, 400);
  cameraX = Math.max(cameraX,0);
  cameraX = Math.min(cameraX, 1000);
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