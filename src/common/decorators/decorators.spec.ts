import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { Role } from '../enums/role.enum';

describe('Decorators', () => {
  describe('Public', () => {
    it('should return a decorator function without throwing', () => {
      const decorator = Public();
      expect(typeof decorator).toBe('function');
      expect(() =>
        decorator({}, 'method', {
          value: (): void => undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        }),
      ).not.toThrow();
    });
  });

  describe('Roles', () => {
    it('should return a decorator function without throwing', () => {
      const decorator = Roles(Role.Admin, Role.User);
      expect(typeof decorator).toBe('function');
      expect(() =>
        decorator({}, 'method', {
          value: (): void => undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        }),
      ).not.toThrow();
    });
  });
});
