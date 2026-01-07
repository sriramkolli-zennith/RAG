import { z } from 'zod';

// Chat validation
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  sessionId: z.string().min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Document validation
export const addDocumentSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  metadata: z.record(z.any()).optional(),
  chunk: z.boolean().optional(),
});

export type AddDocument = z.infer<typeof addDocumentSchema>;

// Batch upload validation
export const batchUploadSchema = z.object({
  documents: z.array(
    z.object({
      content: z.string().min(10),
      source: z.string().optional(),
    })
  ).min(1).max(100, 'Maximum 100 documents per batch'),
});

export type BatchUpload = z.infer<typeof batchUploadSchema>;

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(1000),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export type SearchQuery = z.infer<typeof searchSchema>;

// Validate data and return errors in standard format
export function validateData<T>(schema: z.ZodSchema, data: unknown): { valid: boolean; data?: T; errors?: string[] } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const pathStr = e.path.join('.');
        return pathStr ? `${pathStr}: ${e.message}` : e.message;
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}
