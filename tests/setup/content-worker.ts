/** Vitest setup file: fills the content cache of this worker from the global setup (content-global.ts). */
import { inject } from 'vitest';
import { renames } from 'virtual:hc-packs';
import { primeParsedContent } from '../../src/content/node';
import { setMigrationRenames } from '../../src/persistence/save';

// empty when a run has no global setup (another config): then each worker parses as before
primeParsedContent(inject('parsedContent') ?? {});
// the app passes content/renames.yaml to the save migrations at start (session.ts); tests do the same
setMigrationRenames(renames);
