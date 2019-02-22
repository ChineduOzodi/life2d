var math = require('mathjs');
var Person = require('./classes/person');

function City(x, y, population, cityIndex) {
  this.position = createVector(x,y);
  this.population = population;
  this.people = [];
  this.index = cityIndex;
  for (var i = 0; i < population; i++){
    this.people.push(new Person(x,y));
  }
  this.openNodes = [];
  this.closedNodes = [];
  this.nearCities = [];
  //this.tick = 0;
  this.targetCity = 0;
}

City.prototype.run = function(map) {
  //this.tick++;
  if (this.nearCities.length > 0) {
    for (let i = 0; i < 10; i++){
    	this.aStar(map);
  	} 
  }
   
  for (var i = 0; i < this.people.length; i++){
    this.people[i].run(map);
  }
}

City.prototype.aStar = function(map) {
  var debugIndex = 20;
  
  //reached the top of list, restart from beginning
  if(this.targetCity >= this.nearCities.length) {
    this.targetCity = 0;
  }
  
  //no cities, return
  if(this.nearCities.length == 0) {
    return;
  }
  
  var tCity = this.nearCities[this.targetCity];
  //direction to city not found, increment city target
  if(this.openNodes.length == 0 && this.closedNodes.length > 0) {
    if(this.index == debugIndex) {
    	map.map[tCity.position.x][tCity.position.y].targetCity = false;
    	map.map[tCity.position.x][tCity.position.y].stateChanged = true;
    }
    this.nearCities.splice(this.targetCity,1);
    if(this.index == debugIndex) {
    	console.log("Splice: " + this.nearCities.length);
    }
    this.closedNodes = [];
    return;
  }
  
  //select lowest fCost as currentNode  
  if(this.openNodes.length == 0 && this.closedNodes.length == 0) {
    let currentTile = map.map[this.position.x][this.position.y];
  	let currentNode = currentTile.navigation[this.index.toString()];
    this.openNodes.push(currentNode.position);
  }
  var cNodeIndex = 0;
  // pull current node
  var currentNodePosition = this.openNodes[cNodeIndex];
  this.closedNodes.push(currentNodePosition);
  var currentTile = map.map[currentNodePosition.x][currentNodePosition.y];
  var currentNode = currentTile.navigation[this.index.toString()];
  
  for (var i = 0; i < this.openNodes.length; i++){
    
    let pNodePosition = this.openNodes[i];
    let pTile = map.map[pNodePosition.x][pNodePosition.y];
  	let pNode = pTile.navigation[this.index.toString()];
    
    if(pNode.fCost(map, tCity.index) < currentNode.fCost(map, tCity.index)) {
      cNodeIndex = i;
      currentNodePosition = this.openNodes[cNodeIndex];
  		this.closedNodes.push(currentNodePosition);
  		currentTile = map.map[currentNodePosition.x][currentNodePosition.y];
  		currentNode = currentTile.navigation[this.index.toString()];
    }
  }
  
  this.openNodes.splice(cNodeIndex,1);
  
  //check if targetCity
  
  if(this.index == debugIndex) {
  	map.map[tCity.position.x][tCity.position.y].targetCity = true;
  	map.map[tCity.position.x][tCity.position.y].stateChanged = true;
  }
  if(tCity.position.x == currentTile.position.x && tCity.position.y == currentTile.position.y) {
    //found city
    this.targetCity++;
    this.openNodes = [];
    this.closedNodes = [];
    if(this.index == debugIndex) {
      map.map[tCity.position.x][tCity.position.y].targetCity = false;
    	map.map[tCity.position.x][tCity.position.y].stateChanged = true;
    }
    
    return;
  }
  
  if(this.index == debugIndex) {
    currentTile.debug = 0;
  	currentTile.stateChanged = true;
  }
  
  //check neighbor
  for (let nx = currentNodePosition.x -1; nx < currentNodePosition.x + 2; nx++) {
    for (let ny = currentNodePosition.y -1; ny < currentNodePosition.y + 2; ny++) {
			//continue if out of bounds
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
       	continue; 
      }
      
      //contiue if not city and the not the same biome
      let nTile = map.map[nx][ny];
      if (!currentTile.hasCity && currentTile.biome != nTile.biome && !nTile.hasCity) {
       	continue; 
      }
      
      let nNode = nTile.navigation[this.index.toString()];
      //continure if nNode in closedNodes
      if (this.closedNodes.includes(nNode.position)) {
        continue;
      }
      var nGCost = 10000;
      if (currentTile.biome == "LAND") {
      	nGCost = ((nTile.height - currentTile.height) * 5 + 1) * distanceCost(currentNodePosition, createVector(nx,ny)) / (currentTile.road * 0.01 + 1);
      }
      else {
        nGCost = distanceCost(currentNodePosition, createVector(nx,ny));
      }
      nNode.gCost = nGCost;
      let nHCost = currentNode.hCost + nGCost;
      var tNode = nTile.navigation[this.targetCity];
      nFCost = tNode.hCost + nHCost;
      if(nNode.fCost(map, tCity.index) > nFCost || !this.openNodes.includes(nNode.position)) {
        nNode.hCost = nHCost;
        nNode.direction = createVector(currentNodePosition.x - nNode.position.x,currentNodePosition.y - nNode.position.y);
        
        if (!this.openNodes.includes(nNode.position)) {
          this.openNodes.push(nNode.position);
          if(this.index == debugIndex) {
            nTile.debug = 100;
            nTile.stateChanged = true;
          }
        }
      }
    }
  }
  
  if (this.closedNodes.length > 15000) {
    this.openNodes = [];
    if(this.index == debugIndex) {
      console.log("reached limit, should splice: " + this.nearCities.length.toString());
    }
  }
  
  //info
  //if(this.index == 0) {
  //  //console.log("Tick: " + this.tick);
  //  console.log("Open: " + this.openNodes.length)
  //	console.log("Closed: " + this.closedNodes.length);
  //}
  
}

function distanceCost(pos1,pos2) {
  xDist = math.abs(pos1.x - pos2.x);
  yDist = math.abs(pos1.y - pos2.y);
  sDist = math.abs(xDist - yDist);
  oDist = math.max(xDist,yDist) - sDist;
  
  return sDist * 10 + oDist * 14;
}

function createVector(x,y) {
  return {x:x,y:y};
}

module.exports = City;