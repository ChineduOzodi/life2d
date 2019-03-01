import { Vegetation } from './vegetation';
import { Position } from './position';

describe('Vegetation', () => {
  it('should create an instance', () => {
    expect(new Vegetation('test','id',new Position(0,0,0),0,0)).toBeTruthy();
  });
});
