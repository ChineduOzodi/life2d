function GoapPlan(map, agent, state, actions, goal, callBackFunction) {
    this.map = map;
    this.agent = agent;
    this.state = state;
    this.actions = actions;
    this.goal = goal;
    this.callBackFunction = callBackFunction;
}


module.exports = GoapPlan;