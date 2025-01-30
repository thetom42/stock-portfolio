// Base interface for user data
export interface User {
  id: string;
  email: string;
  firstName: string;    // maps to name in DB
  lastName: string;     // maps to surname in DB
  createdAt: Date;      // maps to join_date in DB
}

// DTO for user creation
export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;     // used for creation only, not exposed in responses
}

// DTO for user updates
export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Authentication credentials
export interface UserCredentials {
  email: string;
  password: string;
}
