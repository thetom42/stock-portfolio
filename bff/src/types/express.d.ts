import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: string[];
      };
    }
  }
}

export {};
