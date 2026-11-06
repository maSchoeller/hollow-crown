/** Vitest setup file: fills the content cache of this worker from the global setup (content-global.ts). */
import { inject } from 'vitest';
import { primeParsedContent } from '../../src/content/node';

primeParsedContent(inject('parsedContent'));
