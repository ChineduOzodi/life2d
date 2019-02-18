var map;
function setup() {
  var mWidth = 200;
  var mHeight = 150;
  var size = 4;
  createCanvas(mWidth * size, mHeight * size);
  map = new Map(mWidth,mHeight,size);
}

function draw() {
  map.run();
}