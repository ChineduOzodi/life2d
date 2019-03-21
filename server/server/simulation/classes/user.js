function User(socketId, username, personId, camera) {
    this.socketId = socketId;
    this.username = username;
    this.camera = camera;
    this.personId = personId;
}

module.exports = User;