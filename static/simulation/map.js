function Map(settings, simObjects) {
    this.name = settings.name;
    this.width = settings.width;
    this.height = settings.height;
    this.tileSize = settings.scale;
    this.settings = settings;
    this.simObjects = simObjects;
    this.map = null;
    this.simplex = new SimplexNoise();
}

Map.prototype.render = function () {
    render = [];
    for (let i = 0; i < this.simObjects.length; i++) {
        this.simObjects[i].render();
    }
}

Map.prototype.generateMap = function (startX,startY,gWidth,gHeight,scale) {

    let tileMap = [];
    let iX = 0;
    for (let x = startX; x < startX + gWidth/scale; x += 1/scale) {
        tileMap.push([]);
        for (let y = startY; y < startY + gHeight / scale; y+= 1/scale) {
            let amplitude = 1;
            let frequency = 1;
            let noiseHeight = 0;
            for (let i = 0; i < this.settings.noise.octaves; i++) {
                let xOff = this.settings.noise.offsets[i][0];
                let yOff = this.settings.noise.offsets[i][1];
                let sampleX = xOff + x * this.settings.noise.scale * frequency;
                let sampleY = yOff + y * this.settings.noise.scale * frequency;
                let h = this.simplex.noise2D(sampleX, sampleY);
                noiseHeight += h * amplitude;
                amplitude *= this.settings.noise.persistence;
                frequency *= this.settings.noise.lacunarity;
            }
            

            tileMap[iX].push({height: noiseHeight});
        }
        iX++;
    }

    //add biomes

    for (let x = 0; x < tileMap.length; x++) {
        for (let y = 0; y < tileMap[0].length; y++) {
            tileMap[x][y].height = lerps(this.settings.noise.minNoiseHeight, this.settings.noise.maxNoiseHeight, tileMap[x][y].height);

            //console.log(`x: ${x}, y: ${y}, height: ${tileMap[x][y].height}`);
            var b = biome(tileMap[x][y].height);
            tileMap[x][y].biome = b[0];
            tileMap[x][y].biomeColor = b[1];
        }
    }

    return tileMap;
}

Map.prototype.getHeight = function (x, y) {

    let amplitude = 1;
    let frequency = 1;
    let noiseHeight = 0;
    for (let i = 0; i < this.settings.noise.octaves; i++) {
        let xOff = this.settings.noise.offsets[i][0];
        let yOff = this.settings.noise.offsets[i][1];
        let sampleX = xOff + x * this.settings.noise.scale * frequency;
        let sampleY = yOff + y * this.settings.noise.scale * frequency;
        let h = this.simplex.noise2D(sampleX, sampleY);
        noiseHeight += h * amplitude;
        amplitude *= this.settings.noise.persistence;
        frequency *= this.settings.noise.lacunarity;
    }
    return lerps(this.settings.noise.minNoiseHeight, this.settings.noise.maxNoiseHeight, noiseHeight);
}

Map.prototype.getBiomeColor = function (x, y) {
    return biome(this.getHeight(x, y))[1];
}

Map.prototype.saveMap = function () {
    map = this;
    return new Promise(function (resolve, reject) {
        var image = PNGImage.createImage(map.width, map.height);

        for (var x = 0; x < map.width; x++) {
            for (var y = 0; y < map.height; y++) {
                let color = map.getBiomeColor(x, y);
                // Set a pixel at (20, 30) with red, having an alpha value of 100 (half-transparent)
                image.setAt(x, y, { red: color[0], green: color[1], blue: color[2], alpha: 255 });

            }
        }

        // // Get index of coordinate in the image buffer
        // var index = image.getIndex(20, 30);

        // // Print the red color value
        // console.log(image.getRed(index));

        // // Get low level image object with buffer from the 'pngjs' package
        // var pngjs = image.getImage();

        image.writeImage('./static/map.png', function (err) {
            if (err) {
                reject(err);
            } else {
                console.log('Written to the file');
                resolve()
            }
        });
    });

}

function biome(e) {
    var waterlevel = 0.5;
    var WATER = colors(e * 100, e * 100, 255 * e + 100);
    var LAND = colors(0, 255 * e, 0);
    if (e < waterlevel) return ["OCEAN", WATER];
    else return ["LAND", LAND];
}

function distanceCost(pos1, pos2) {
    xDist = math.abs(pos1.x - pos2.x);
    yDist = math.abs(pos1.y - pos2.y);
    sDist = math.abs(xDist - yDist);
    oDist = math.max(xDist, yDist) - sDist;

    return sDist * 10 + oDist * 14;
}

function createVector(x, y) {
    return { x: x, y: y };
}

function lerps(min, max, num) {
    return (num - min) / (max - min);
}

function colors(r, g, b) {
    return [r, g, b];
  }

// cam x-coord to canvas x-coord
function camX(x) {
    return tx + (x - width / 2) / zoom;
}

// cam y-coord to canvas y-coord
function camY(y) {
    return ty + (y - height / 2) / zoom;
}