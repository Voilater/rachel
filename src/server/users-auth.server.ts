import {
  authenticateUserWithCognito,
  registerUserWithCognito,
} from "@/server/cognito-auth.server";
import type { ClientUserDto } from "@/server/user-types";

/** Email/password login — stores and verifies users in Amazon Cognito. */
export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  return authenticateUserWithCognito(input);
}

/** Email/password signup — creates the user in Amazon Cognito. */
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ClientUserDto> {
  return registerUserWithCognito(input);
}
