var maptiles;
var mWidth;
var mHeight;
var canDraw =false;
var s;
var loadImg;
var map;

function setup() {
  mWidth = 1000;
  s = 2;
  mHeight = 400;
  createCanvas(mWidth * s, mHeight * s);
  background('black');
  noStroke();
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