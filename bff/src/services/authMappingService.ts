import { userService } from './userService';
import { AuthUser } from '../types/express';

/**
 * Interface for any authentication provider's user info
 * This keeps our code provider-agnostic
 */
interface AuthProviderUser {
  id: string;          // Provider's user ID (e.g., Keycloak UUID)
  email: string;       // User's email (used for mapping)
  firstName: string;   // First name from provider
  lastName: string;    // Last name from provider
  roles?: string[];    // Roles from provider
}

/**
 * Maps an authentication provider's user to our internal user
 * Uses email as the linking field between systems
 */
export const mapAuthProviderUser = async (providerUser: AuthProviderUser): Promise<AuthUser | null> => {
  try {
    // Find our internal user by email
    const internalUser = await userService.getUserByEmail(providerUser.email);

    if (!internalUser) {
      console.warn(`No internal user found for email: ${providerUser.email}`);
      return null;
    }

    // Return mapped user with our internal ID but provider's roles
    return {
      id: internalUser.id,           // Use our internal ID
      email: internalUser.email,     // Keep provider's email
      firstName: internalUser.firstName,
      lastName: internalUser.lastName,
      roles: providerUser.roles || []  // Keep provider's roles
    };
  } catch (error) {
    console.error('Error mapping auth provider user:', error);
    return null;
  }
};
