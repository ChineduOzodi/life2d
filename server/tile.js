function Tile(x, y, size, biome, biomeColor) {
  this.position = createVector(x, y);
  this.height = 0;
  this.size = size;
  this.biome = biome;
  this.biomeColor = biomeColor;
  this.stateChanged = true;
  this.navigation = {};
  this.peopleCount = 0;
  this.debug = 0;
  this.road = 0;
  this.nRoadCount = 0;
  this.targetCity = false;
  //Create city
  if (biome != "OCEAN" && random() < 0.005) {
    this.hasCity = true;
  }
}

Tile.prototype.run = function() {
  if (this.road > 0) {
    //print(this.road);
    //if (this.nRoadCount > 4 && this.road > 0) {
    //  this.road = 1;
    //}
    this.road--;
    this.stateChanged = true;
    if(this.road == 0) {
        //check neighbor
  			for (let nx = this.position.x -1; nx < this.position.x + 2; nx++) {
    			for (let ny = this.position.y -1; ny < this.position.y + 2; ny++) {
            //continue if out of bounds
            if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
              continue; 
            }
            
            let nTile = map.map[nx][ny];
            nTile.nRoadCount--;
          }
        }
      }
  }
  this.render();
}

// Draw boid as a circle
Tile.prototype.render = function() {
  let showDebug = true;
  let showPeople = true;
  if (this.stateChanged) {
    this.stateChanged = false;
    
    if (this.targetCity && showDebug) {
      fill(color('purple'));
    }
    else if (this.hasCity) {
      let c = color('yellow');
      fill(c);
    }
    else if (this.peopleCount > 0 && showPeople) {
      let c = lerpColor(color('red'),color('yellow'),(this.peopleCount)/10);
      fill(c);
    }
    else if (this.road > 0) {
      if (this.biome == "OCEAN") {
        let c = lerpColor(this.biomeColor,color('white'),this.road * 0.002);
      	fill(c);
      }
      else if( this.road > 800) {
        let c = lerpColor(this.biomeColor,color('black'), 0.7);
        fill(c);
      }
      else {
        let c = lerpColor(this.biomeColor,color('grey'),this.road * 0.002);
      	fill(c);
      }
      
    }
    else if (this.debug > 1 && showDebug) {
      this.debug--;
      this.stateChanged = true;
      let c = lerpColor(this.biomeColor,color('black'), 0.25);
      fill(c);
    }
    else {
    	fill(this.biomeColor);
    }
  	noStroke();
    rect(this.position.x * this.size - this.size * 0.5, this.position.y * this.size - this.size * 0.5, this.size, this.size);
  }
}

module.exports = Tile;