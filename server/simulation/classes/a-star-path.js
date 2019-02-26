function AStarPath(position, direction, distance, isTarget) {
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
    if (direction.x < 0) {
        agent.position.x = Math.max(this.position.x, agent.position.x);
    } else if (direction.x > 0) {
        agent.position.x = Math.min(this.position.x, agent.position.x);
    }
    if (direction.y < 0) {
        agent.position.y = Math.max(this.position.y, agent.position.y);
    } else if (direction.y > 0) {
        agent.position.y = Math.min(this.position.y, agent.position.y);
    }

    //check if reached target
    if (this.position.x == agent.position.x && this.position.y == agent.position.y) {
        return true;
    } else {
        return false;
    }
}

module.exports = AStarPath;