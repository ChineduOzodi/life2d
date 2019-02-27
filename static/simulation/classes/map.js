function Map(settings) {
    if (settings){
        this.name = settings.name;
        this.width = settings.width;
        this.height = settings.height;
        this.scale = settings.scale;
        this.settings = settings;
    }
    this.vegetationSettings = [];
    this.peopleSettings = [];
    this.pendingChunks = [];
    this.vegetation = [];
    this.people = [];
    this.chunkData = {};
    this.map = {};
    this.id = 1;
}