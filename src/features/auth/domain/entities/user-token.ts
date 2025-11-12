import { z } from "zod";
import { Timestamp } from "firebase/firestore";

/**
 * UserToken entity for storing OAuth tokens
 * Stores encrypted OAuth tokens for external platform integrations
 */
export const UserTokenSchema = z.object({
  userId: z.string(),
  provider: z.enum(["google-tasks", "notion", "asana", "microsoft-todo"]),
  accessToken: z.string(), // Encrypted by Firebase Admin SDK
  refreshToken: z.string().optional(), // Encrypted by Firebase Admin SDK
  expiresAt: z.instanceof(Date).or(z.instanceof(Timestamp)),
  scopes: z.array(z.string()),
  createdAt: z.instanceof(Date).or(z.instanceof(Timestamp)),
  updatedAt: z.instanceof(Date).or(z.instanceof(Timestamp)),
});

export type UserToken = z.infer<typeof UserTokenSchema>;

export const CreateUserTokenSchema = UserTokenSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type CreateUserTokenInput = z.infer<typeof CreateUserTokenSchema>;
