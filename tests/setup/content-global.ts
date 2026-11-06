/**
 * Vitest global setup: parses the content YAML once per run and hands it to every test worker (see content-worker.ts).
 * Each test file runs in a fresh worker, and parsing all content was about 1.1 s of every file that loads content (story 15.11 kept the
 * parsed documents only for the life of one worker).
 */
import type { TestProject } from 'vitest/node';
import { parsedContent, type ParsedContent } from '../../src/content/node';

declare module 'vitest' {
  export interface ProvidedContext {
    parsedContent: ParsedContent;
  }
}

export function setup(project: TestProject): void {
  project.provide('parsedContent', parsedContent());
}
