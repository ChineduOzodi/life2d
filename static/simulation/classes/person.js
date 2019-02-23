function Person(x, y, settingsIndex, baseSpriteIndex) {
  Entity.call(this,x,y,settingsIndex,baseSpriteIndex)
}

Person.prototype = Object.create(Entity.prototype);

Person.prototype.run = function(map) {
	if (this.targetCity == null) {
    if(this.wait > 0) {
      this.wait--;
      return;
    }
    var possibleCities = [];
    var nav = map.map[this.position.x][this.position.y].navigation;
    // var totalDist = 0;
    //select target city
    for (let key in nav) {
    	// check if the property/key is defined in the object itself, not in parent
    	if (nav.hasOwnProperty(key)) {
        //console.log(key, dictionary[key]);
      	let node = nav[key];
        if (node.direction.x != 0 && node.direction.y != 0) {
          //console.log("key: " + key);
          //console.log("direction (" + node.direction.x + "," + node.direction.y + ")");
          possibleCities.push(key);
          //let dista = 1000.0 / nav[key].hCost;
          this.pCities[key] = 1000.0 / nav[key].hCost * Math.random();
        }
    	}
		}
    if (possibleCities.length > 0) {
      this.targetCity = possibleCities[0];
      //console.log("cities: " + possibleCities);
    	//this.targetCity =  possibleCities[floor(random(0,possibleCities.length))];
      let rNum = this.pCities[possibleCities[0]];
      //console.log("totalDist: " + totalDist);
      //console.log("rNum: " + rNum);
      for(let i = 0; i < possibleCities.length; i++) {
        let key = possibleCities[i];
        if (rNum < this.pCities[key]) {
          //console.log("cityDist: " + nav[key].dista);
          //console.log("rNum: " + rNum);
          this.targetCity = key;
          rNum = this.pCities[key];
        }
      }
      //console.log("Found city: " + this.targetCity);
    }
  }
  if (this.targetCity != null) {
    //move
    if (this.moveCount > 0) {
      this.moveCount--;
      //console.log(this.moveCount);
    }
    
    else {
      //console.log("moving");
			let currentTile = map.map[this.position.x][this.position.y];
      currentTile.peopleCount--;
      if (currentTile.peopleCount <= 0) {
        currentTile.stateChanged = true;
      }
      let cNode = currentTile.navigation[this.targetCity];
      this.position = createVector(cNode.direction.x + this.position.x,cNode.direction.y + this.position.y);
      this.moveCount = currentTile.navigation[this.targetCity].gCost;
      let newTile = map.map[this.position.x][this.position.y];
      newTile.peopleCount++;
      let createRoad = true;
      //if(newTile.road == 0) {
      //  //check neighbor
  		//	for (let nx = this.position.x -1; nx < this.position.x + 2; nx++) {
    	//		for (let ny = this.position.y -1; ny < this.position.y + 2; ny++) {
      //      //continue if out of bounds
      //      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
      //        continue; 
      //      }
      //      
      //      let nTile = map.map[nx][ny];
      //      if(nTile.nRoadCount > 4) {
      //        createRoad = false;
      //      }
      //    }
      //  }
      //}
      if(createRoad) {
        //check neighbor
  			for (let nx = this.position.x -1; nx < this.position.x + 2; nx++) {
    			for (let ny = this.position.y -1; ny < this.position.y + 2; ny++) {
            //continue if out of bounds
            if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
              continue; 
            }
            
            let nTile = map.map[nx][ny];
            nTile.nRoadCount++;
          }
        }
      }
      
      if (newTile.road <= 900 && createRoad) {
        newTile.road += 50;
      }
      
      if (newTile.peopleCount == 1) {
        newTile.stateChanged = true;
      }
      
      //check if arrived
      if (map.cities[this.targetCity].position.x == this.position.x && map.cities[this.targetCity].position.y == this.position.y){
        this.targetCity = null;
      }
    }
  }
  
  
}

function createVector(x,y) {
  return {x:x,y:y};
}