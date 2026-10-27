/**
 * Third-party notices shown on the Licenses page (concept/23-art-direction/licensing.md A12, story 8.7 AC3).
 * Names, copyright lines and license names are data copied from the packages; the full texts are the packages' own
 * license files, served as static files from public/licenses/ (precached, so they work offline).
 */
export interface LicenseEntry {
  id: string;
  name: string;
  copyright: string;
  license: string;
  /** Files under public/licenses/ (verbatim copies from node_modules). */
  files: string[];
}

const OFL = 'SIL Open Font License 1.1';

export const FONT_LICENSES: LicenseEntry[] = [
  { id: 'fraunces', name: 'Fraunces', copyright: 'Copyright 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces)', license: OFL, files: ['fraunces.txt'] },
  { id: 'barlow', name: 'Barlow', copyright: 'Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow)', license: OFL, files: ['barlow.txt'] },
  { id: 'barlow-condensed', name: 'Barlow Condensed', copyright: 'Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow)', license: OFL, files: ['barlow-condensed.txt'] },
];

export const LIBRARY_LICENSES: LicenseEntry[] = [
  { id: 'babylonjs', name: 'Babylon.js', copyright: 'Copyright 2023 The Babylon.js team', license: 'Apache-2.0', files: ['babylonjs-apache-2.0.txt', 'babylonjs-notice.txt'] },
  { id: 'preact', name: 'Preact', copyright: 'Copyright (c) 2015-present Jason Miller', license: 'MIT', files: ['preact.txt'] },
  { id: 'preact-signals', name: '@preact/signals', copyright: 'Copyright (c) 2022-present Preact Team', license: 'MIT', files: ['preact-signals.txt'] },
  { id: 'zod', name: 'zod', copyright: 'Copyright (c) 2025 Colin McDonnell', license: 'MIT', files: ['zod.txt'] },
  { id: 'meshoptimizer', name: 'meshoptimizer', copyright: 'Copyright (c) 2016-2026 Arseny Kapoulkine', license: 'MIT', files: ['meshoptimizer.txt'] },
  { id: 'idb', name: 'idb', copyright: 'Copyright (c) 2016, Jake Archibald', license: 'ISC', files: ['idb.txt'] },
  { id: 'yaml', name: 'yaml', copyright: 'Copyright Eemeli Aro', license: 'ISC', files: ['yaml.txt'] },
];
