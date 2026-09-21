import { z } from "zod";

export const searchOptionsSchema = z
  .object({
    maxResults: z.number().int().positive().optional(),
    includeDomains: z.array(z.string().min(1)).optional(),
    excludeDomains: z.array(z.string().min(1)).optional(),
    topic: z.enum(["general", "news"]).optional(),
  })
  .strict();

export const searchResultSchema = z
  .object({
    url: z.string().url(),
    title: z.string().min(1),
    snippet: z.string().optional(),
    publishedAt: z.string().min(1).optional(),
    score: z.number().optional(),
  })
  .strict();

export type SearchOptions = z.infer<typeof searchOptionsSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;

export interface SearchProvider {
  readonly providerId: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
