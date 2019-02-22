var math = require('mathjs');

function Tile(x, y, size, height) {
  this.position = createVector(x, y);
  this.height = height;
  this.size = size;
  this.biome = null;
  this.biomeColor = null;
  this.stateChanged = true;
  this.navigation = {};
  this.peopleCount = 0;
  this.debug = 0;
  this.road = 0;
  this.nRoadCount = 0;
  this.targetCity = false;
}

Tile.prototype.run = function(map) {
  if (this.road > 0) {
    //console.log(this.road);
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
  //this.render();
}

// Draw boid as a circle
Tile.prototype.render = function(all) {
  let showDebug = true;
  let showPeople = true;
  let render = {x:this.position.x,y:this.position.y}
  if (this.stateChanged || all) {
    this.stateChanged = false;
    
    if (this.targetCity && showDebug) {
      render['color'] =  'purple';
      //fill(color('purple'));
    }
    else if (this.hasCity) {
      render['color'] = 'yellow';
      // let c = color('yellow');
      // fill(c);
    }
    else if (this.peopleCount > 0 && showPeople) {
      render['color'] = 'orange';
      // let c = lerpColor(color('red'),color('yellow'),(this.peopleCount)/10);
      // fill(c);
    }
    else if (this.road > 0) {
      if (this.biome == "OCEAN") {
        render['color'] = [200,200,230];
        // let c = lerpColor(this.biomeColor,color('white'),this.road * 0.002);
      	// fill(c);
      }
      else if( this.road > 800) {
        render['color'] = [20,20,20];
        // let c = lerpColor(this.biomeColor,color('black'), 0.7);
        // fill(c);
      }
      else {
        render['color'] = 'grey';
        // let c = lerpColor(this.biomeColor,color('grey'),this.road * 0.002);
      	// fill(c);
      }
      
    }
    else if (this.debug > 1 && showDebug) {
      this.debug--;
      this.stateChanged = true;
      render['color'] = 'grey';
      // let c = lerpColor(this.biomeColor,color('black'), 0.25);
      // fill(c);
    }
    else {
      render['color'] = this.biomeColor;
    	//fill(this.biomeColor);
    }
    return render;
  	// noStroke();
    // rect(this.position.x * this.size - this.size * 0.5, this.position.y * this.size - this.size * 0.5, this.size, this.size);
  }
}

function createVector(x,y) {
  return {x:x,y:y};
}

module.exports = Tile;