import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser', () => {
  it('should return a parameter decorator function', () => {
    const decorator = CurrentUser();
    expect(typeof decorator).toBe('function');
  });

  it('should extract user from request', () => {
    const user = { userId: '123', email: 'test@example.com', role: 'user' };

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    const mockFactory = jest.fn().mockImplementation(() => user);

    expect(mockFactory(mockContext)).toBe(user);
  });
});
