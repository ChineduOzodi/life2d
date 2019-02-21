function Camera(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.cameraSpeed = 10;
  this.cameraZoomZEffect = 1.2;
  this.cameraZoomSpeed = .001;
}

Camera.prototype.zoom = function (delta, locationX, locationY, screenWidth, screenHeight) {
  //move the square according to the vertical scroll amount
  // print(`x: ${this.x}, y: ${this.y}, zoom: ${this.z}`);
  var newZoom = this.z - this.cameraZoomSpeed * delta * this.z;
  var dx = locationX - screenWidth / 2;
  var dy = locationY - screenHeight / 2;
  // print(`new zoom: ${newZoom}, dx: ${dx}, dy: ${dy}, mouseX: ${locationX}, mouseY: ${locationY}`);
  this.x += dx / this.z - dx / newZoom;
  this.y += dy / this.z - dy / newZoom;
  this.z = newZoom;
  // print(`new x: ${this.x}, y: ${this.y}, zoom: ${this.z}`);
  this.z = Math.max(.00001, this.z);
  this.z = Math.min(20, this.z);
}

Camera.prototype.translate = function(movement) {
  let moved = false;
  if (movement.up) {
    this.y -= this.cameraSpeed * Math.pow(1 / this.z, this.cameraZoomZEffect);
    moved = true;
  }
  if (movement.down) {
    this.y += this.cameraSpeed * Math.pow(1 / this.z, this.cameraZoomZEffect);
    moved = true;
  }
  if (movement.left) {
    this.x -= this.cameraSpeed * Math.pow(1 / this.z, this.cameraZoomZEffect);
    moved = true;
  }
  if (movement.right) {
    this.x += this.cameraSpeed * Math.pow(1 / this.z, this.cameraZoomZEffect);
    moved = true;
  }
  // this.y = Math.max(this.y, 0);
  // this.y = Math.min(this.y, 400);
  // this.x = Math.max(this.x, 0);
  // this.x = Math.min(this.x, 1000);
  return moved;
}