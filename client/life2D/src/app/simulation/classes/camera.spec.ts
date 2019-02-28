import { Camera } from './camera';
import { Position } from './position';

describe('Camera', () => {
  it('should create an instance', () => {
    expect(new Camera( new Position(0,0,0),4)).toBeTruthy();
  });
});
