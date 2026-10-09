export {};

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth after a valid access token
      userId?: number;
    }
  }
}
