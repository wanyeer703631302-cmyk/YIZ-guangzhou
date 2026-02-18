export const dbOp = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      console.error(`Database operation failed (attempt ${i + 1}/${retries}):`, e.message);
      if (e.message?.includes('Server has closed the connection') || e.message?.includes('Connection lost')) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
};
