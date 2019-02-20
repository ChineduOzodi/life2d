var maptiles;
var canDraw = false;
var loadImg;
var sMap;
var cameraSpeed = 10;
var cameraZoomZEffect = 1.2;
var cameraZoomSpeed = .001;

var cameraX = 0;
var cameraY = 0;
var cameraZ;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('black');
  noStroke();
  cameraZ = 1;
}

// function preload() {
//   map = loadImage('./static/map.png');
// }

// function windowResized() {
//   //resizeCanvas(windowWidth, windowHeight);
// }

function draw() {
  if (sMap) {
    loadPixels();
    // tiles = sMap.generateMap(0, 0, windowWidth, windowHeight, 1);
    tiles = sMap.generateMap(- width / 2 + cameraX * cameraZ, - height / 2 + cameraY * cameraZ, windowWidth, windowHeight, cameraZ);
    // print(`new x: ${cameraX}, y: ${cameraY}, zoom: ${cameraZ}`);
    for (let x = 0; x < tiles.length; x++) {
      for (let y = 0; y < tiles[0].length; y++) {
        var index = (x + y * tiles.length) * 4;
        pixels[index + 0] = tiles[x][y].biomeColor[0];
        pixels[index + 1] = tiles[x][y].biomeColor[1];
        pixels[index + 2] = tiles[x][y].biomeColor[2];
        pixels[index + 3] = 255;
        // pixels[index + 0] = 250;
        // pixels[index + 1] = 100;
        // pixels[index + 2] = 100;
        // pixels[index + 3] = 255;
      }
    }
    //print(tiles);
    //sMap = null;
    updatePixels();
  }
  
  //translate(width/2,height/2);
  //translate(-cameraX * cameraZ, -cameraY * cameraZ);
  //scale(cameraZ);
  // if (map) {
  //   image(map, 0, 0);
  // }
  // if (loadImg) {
  //   loadImg = false;
  //   map = loadImage('./static/map.png');
  //   console.log('image loaded');
  // }
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
  var newZoom = cameraZ - cameraZoomSpeed * event.delta * cameraZ;
  var dx = mouseX - width / 2;
  var dy = mouseY - height / 2;
  // print(`new zoom: ${newZoom}, dx: ${dx}, dy: ${dy}, mouseX: ${mouseX}, mouseY: ${mouseY}`);
  cameraX += dx / cameraZ - dx / newZoom;
  cameraY += dy / cameraZ - dy / newZoom;
  cameraZ = newZoom;
  // print(`new x: ${cameraX}, y: ${cameraY}, zoom: ${cameraZ}`);
  cameraZ = Math.max(.00001, cameraZ);
  cameraZ = Math.min(20, cameraZ);
  //uncomment to block page scrolling
  //return false;
}

function moveCamera() {
  if (movement.up) {
    cameraY -= cameraSpeed * Math.pow(1 / cameraZ, cameraZoomZEffect);
  }
  if (movement.down) {
    cameraY += cameraSpeed * Math.pow(1 / cameraZ, cameraZoomZEffect);
  }
  if (movement.left) {
    cameraX -= cameraSpeed * Math.pow(1 / cameraZ, cameraZoomZEffect);
  }
  if (movement.right) {
    cameraX += cameraSpeed * Math.pow(1 / cameraZ, cameraZoomZEffect);
  }
  // cameraY = Math.max(cameraY, 0);
  // cameraY = Math.min(cameraY, 400);
  // cameraX = Math.max(cameraX, 0);
  // cameraX = Math.min(cameraX, 1000);
}

socket.on('map', function (mapData) {
  sMap = JSON.parse(mapData);
  console.log(mapData);
  sMap = new Map(sMap.settings);
  //loadImg = true;
  // canDraw = true;
  // width = w;
  // height = h;
  // maptiles = tiles;
  // console.log(map);
  // console.log(width);
  // console.log(height);
});