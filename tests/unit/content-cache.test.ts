/** The content cache the test workers get from the global setup (tests/setup): a kept document counts only while its file is unchanged. */
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, inject, it } from 'vitest';
import { parsedContent, primeParsedContent, readContentFiles } from '../../src/content/node';

const FILE = 'core/balance.yaml';
const path = join(process.cwd(), 'content', FILE);

describe('content cache of the test workers', () => {
  it('gets the content files from the global setup under the path and stamp the worker looks up', () => {
    const kept = inject('parsedContent');
    const st = statSync(path);
    expect(kept[path]?.stamp).toBe(`${st.size}:${st.mtimeMs}:${st.ctimeMs}`);
  });

  it('uses a kept document while the stamp matches and parses the file anew when it does not', () => {
    const real = parsedContent()[path]!;
    try {
      primeParsedContent({ [path]: { stamp: real.stamp, doc: { marker: true } } });
      expect(readContentFiles()[`content/${FILE}`]).toEqual({ marker: true });
      primeParsedContent({ [path]: { stamp: 'stale', doc: { marker: true } } });
      expect(readContentFiles()[`content/${FILE}`]).toEqual(real.doc);
    } finally {
      primeParsedContent({ [path]: real });
    }
  });

  it('hands out copies, so a test that changes its content leaves the kept document alone', () => {
    const a = readContentFiles()[`content/${FILE}`] as Record<string, unknown>;
    a.changed = true;
    expect((readContentFiles()[`content/${FILE}`] as Record<string, unknown>).changed).toBeUndefined();
  });
});
