import { Movement } from './movement';
import { Position } from './position';
export class Camera {

    public position: Position;
    public zoomLevel: number;

    private cameraSpeed = 10;
    private cameraZoomZEffect = 1.2;
    private cameraZoomSpeed = .001;
    private cameraMaxZoom = 20;
    private cameraMinZoom = .00001;

    constructor(position: Position, zoomLevel: number) {
        this.position = position;
        this.zoomLevel = zoomLevel;
    }

    zoom(delta: number, locationX: number, locationY: number, screenWidth: number, screenHeight: number) {
        const newZoom = this.zoomLevel - this.cameraZoomSpeed * delta * this.zoomLevel;
        const dx = locationX - screenWidth / 2;
        const dy = locationY - screenHeight / 2;

        // console.log(`x: ${this.position.x}, y: ${this.position.y},
        // dx: ${dx}, dy: ${dy}, zoomLevel: ${this.zoomLevel}, newZoom: ${newZoom}`);
        this.position.x += dx / this.zoomLevel - dx / newZoom;
        this.position.y += dy / this.zoomLevel - dy / newZoom;
        this.zoomLevel = newZoom;

        this.zoomLevel = Math.max(this.cameraMinZoom, this.zoomLevel);
        this.zoomLevel = Math.min(this.cameraMaxZoom, this.zoomLevel);
    }

    translate(movement: Movement): boolean {
        let moved = false;
        if (movement.up) {
            this.position.y -= this.cameraSpeed * Math.pow(1 / this.zoomLevel, this.cameraZoomZEffect);
            moved = true;
        }
        if (movement.down) {
            this.position.y += this.cameraSpeed * Math.pow(1 / this.zoomLevel, this.cameraZoomZEffect);
            moved = true;
        }
        if (movement.left) {
            this.position.x -= this.cameraSpeed * Math.pow(1 / this.zoomLevel, this.cameraZoomZEffect);
            moved = true;
        }
        if (movement.right) {
            this.position.x += this.cameraSpeed * Math.pow(1 / this.zoomLevel, this.cameraZoomZEffect);
            moved = true;
        }
        // this.y = Math.max(this.y, 0);
        // this.y = Math.min(this.y, 400);
        // this.x = Math.max(this.x, 0);
        // this.x = Math.min(this.x, 1000);
        return moved;
    }
}
