function AStarTask(startPosition, endPosition, map, callBackFunction) {
    this.startPosition = startPosition;
    this.endPosition = endPosition;
    this.callBackFunction = callBackFunction;
    this.map = map;
}

module.exports = AStarTask;