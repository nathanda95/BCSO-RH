import { ZodError, ZodSchema } from "zod";

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T | null {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return null;
    }
    throw error;
  }
}
