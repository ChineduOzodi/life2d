function Person(x, y) {
  this.position = createVector(x,y);
  this.moveCount = 0;
  this.targetCity = null;
  this.wait = 0;
  this.pCities = {};
}

Person.prototype.run = function() {
	if (this.targetCity == null) {
    if(this.wait > 0) {
      this.wait--;
      return;
    }
    var possibleCities = [];
    var nav = map.map[this.position.x][this.position.y].navigation;
    var totalDist = 0;
    //select target city
    for (let key in nav) {
    	// check if the property/key is defined in the object itself, not in parent
    	if (nav.hasOwnProperty(key)) {
        //console.log(key, dictionary[key]);
      	let node = nav[key];
        if (node.direction.x != 0 && node.direction.y != 0) {
          //print("key: " + key);
          //print("direction (" + node.direction.x + "," + node.direction.y + ")");
          possibleCities.push(key);
          //let dista = 1000.0 / nav[key].hCost;
          this.pCities[key] = 1000.0 / nav[key].hCost * random();
        }
    	}
		}
    if (possibleCities.length > 0) {
      this.targetCity = possibleCities[0];
      //print("cities: " + possibleCities);
    	//this.targetCity =  possibleCities[floor(random(0,possibleCities.length))];
      let rNum = this.pCities[possibleCities[0]];
      //print("totalDist: " + totalDist);
      //print("rNum: " + rNum);
      for(let i = 0; i < possibleCities.length; i++) {
        let key = possibleCities[i];
        if (rNum < this.pCities[key]) {
          //print("cityDist: " + nav[key].dista);
          //print("rNum: " + rNum);
          this.targetCity = key;
          rNum = this.pCities[key];
        }
      }
      //print("Found city: " + this.targetCity);
    }
  }
  if (this.targetCity != null) {
    //move
    if (this.moveCount > 0) {
      this.moveCount--;
      //print(this.moveCount);
    }
    
    else {
      //print("moving");
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