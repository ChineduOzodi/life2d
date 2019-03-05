function AStarPath(position, direction, distance) {
    // this.id = `city:${cityIndex}x:${x}y:${y}`;
    this.position = position;
    this.direction = direction;
    this.distance = distance;
}

AStarPath.prototype.moveAgent = function (agent, deltaTime) {
    let moveAmount = agent.speed * deltaTime;
    agent.position.x += this.direction.x * moveAmount;
    agent.position.y += this.direction.y * moveAmount;

    //clamp
    if (this.direction.x < 0) {
        agent.position.x = Math.max(this.position.x, agent.position.x);
    } else if (this.direction.x > 0) {
        agent.position.x = Math.min(this.position.x, agent.position.x);
    }
    if (this.direction.y < 0) {
        agent.position.y = Math.max(this.position.y, agent.position.y);
    } else if (this.direction.y > 0) {
        agent.position.y = Math.min(this.position.y, agent.position.y);
    }

    //return distance to target
    return distance(this.position,agent.position);
}

function distance(pos1, pos2) {
    xDist = math.abs(pos1.x - pos2.x);
    yDist = math.abs(pos1.y - pos2.y);
    sDist = math.abs(xDist - yDist);
    oDist = math.max(xDist, yDist) - sDist;
  
    return sDist + oDist * 1.4;
  }

module.exports = AStarPath;