math = require('mathjs');
Node = require('./node');
function AStar() {
}

AStar.prototype.findPath = function (startPosition, endPosition, map) {
    let closedNodes = [];
    let openNodes = [];
    let startNode = new Node(startPosition.x, startPosition.y, map, 0, distanceCost(startPosition, endPosition));
    let targetNode = new Node(endPosition.x, endPosition.y, map);
    openNodes.push(startNode);
    thisAStar = this;
    let nodeMap = {};
    nodeMap[`x:${targetNode.position.x},y:${targetNode.position.y}`] = targetNode;
    nodeMap[`x:${startNode.position.x},y:${startNode.position.y}`] = startNode;
    console.log(`finding path from: x:${startNode.position.x},y:${startNode.position.y} to x:${targetNode.position.x},y:${targetNode.position.y}`);
    return new Promise((resolve, reject) => {
        while (openNodes.length > 0) {
            // pull current node
            let cNodeIndex = 0;
            let currentNode = openNodes[cNodeIndex];
            console.log(`pathSearch: ${openNodes.length}`);
            for (let i = 0; i < openNodes.length; i++) {
                let pNode = openNodes[i];

                if (pNode.fCost() < currentNode.fCost()) {
                    cNodeIndex = i;
                    currentNode = pNode;
                }
            }
            closedNodes.push(currentNode);
            openNodes.splice(cNodeIndex, 1);

            //check if node == target
            if (currentNode.position.x == targetNode.position.x && currentNode.position.y == targetNode.position.y) {
                //found node
                let path = thisAStar.createPath(currentNode);
                console.log('reached target node, retracing steps...');
                resolve(path);
                console.log(`found path: ${JSON.stringify(path)}`);
                break;
            }

            //check neighbor
            for (let nx = currentNode.position.x - 1; nx < currentNode.position.x + 2; nx++) {
                for (let ny = currentNode.position.y - 1; ny < currentNode.position.y + 2; ny++) {
                    //continue if out of bounds
                    // if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
                    //     continue;
                    // }

                    let nNode;
                    let nPosition = { x: nx, y: ny };

                    //check node in nodeMap
                    if (nodeMap[`x:${nx},y:${ny}`]) {
                        nNode = nodeMap[`x:${nx},y:${ny}`];
                    } else {
                        //create new nNode
                        nNode = new Node(nx, ny, map,currentNode.gCost + distanceCost(currentNode.position, nPosition), distanceCost(nPosition, targetNode.position),currentNode);
                    }

                    //continure if nNode in closedNodes or water biome
                    if (nNode.biome[0] == 'water' || closedNodes.includes(nNode)) {
                        continue;
                    }
                    // nGCost = ((nTile.height - currentTile.height) * 5 + 1) * distanceCost(currentNodePosition, createVector(nx, ny)) / (currentTile.road * 0.01 + 1);

                    //check to see if gCost is lower or not in open nodes
                    if (currentNode.gCost + distanceCost(currentNode.position, nPosition) < nNode.gCost || !openNodes.includes(nNode)) {
                        nNode.gCost = currentNode.gCost + distanceCost(currentNode.position, nPosition);
                        nNode.parent = currentNode;
                        if (!openNodes.includes(nNode)) {
                            openNodes.push(nNode);
                            // console.log(`added node: ${JSON.stringify(nNode)}`);
                        }
                    }
                }
            }
        }
        console.log(`did not find path`);
        reject('did not find path');
    });
}

AStar.prototype.createPath = function (endNode) {
    return endNode;
}



function distanceCost(pos1, pos2) {
    xDist = math.abs(pos1.x - pos2.x);
    yDist = math.abs(pos1.y - pos2.y);
    sDist = math.abs(xDist - yDist);
    oDist = math.max(xDist, yDist) - sDist;

    return sDist * 10 + oDist * 14;
}

module.exports = AStar;