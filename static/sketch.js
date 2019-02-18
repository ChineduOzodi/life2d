var map;
function setup() {

  createCanvas(mWidth * size, mHeight * size);
  map = new Map(mWidth,mHeight,size);
}

function draw() {
  map.run();
}