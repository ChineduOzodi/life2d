import { Position } from './position';
import { MovingEntity } from './moving-entity';

describe('MovingEntity', () => {
  it('should create an instance', () => {
    expect(new MovingEntity('', new Position(0, 0, 0), 0, 0)).toBeTruthy();
  });
});
