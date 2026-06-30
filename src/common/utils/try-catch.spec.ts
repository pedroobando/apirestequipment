import { tryCatch } from './try-catch';

describe('tryCatch', () => {
  it('should return data and null error on success', async () => {
    const [data, error] = await tryCatch(Promise.resolve('success'));

    expect(data).toBe('success');
    expect(error).toBeNull();
  });

  it('should return null data and error instance on failure', async () => {
    const testError = new Error('failure');
    const [data, error] = await tryCatch(Promise.reject(testError));

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('failure');
  });

  it('should wrap non-error rejections in Error', async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    const [data, error] = await tryCatch(Promise.reject('string error'));

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('string error');
  });
});
