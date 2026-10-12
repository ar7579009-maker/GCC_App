// Synthetic sync file: shaped like pw-sync-latest.json, with no real study data.
import type { PwFile } from '../../src/core/types';

export const pwSample: PwFile = {
  updated: '2026-10-10T11:54:09.228Z',
  subjects: [
    { name: 'Notices', chapters: [{ name: 'x', lectures: [{ title: 'ignored', durSec: 600 }] }] },
    {
      name: 'Theory of Computation',
      chapters: [
        {
          name: 'DFA',
          lectures: [
            { title: 'DFA 01', durSec: 3600, state: 'done' },
            { title: 'DFA 02', durSec: 3600 },
            { title: 'DFA 03', durSec: 1800 },
          ],
        },
      ],
    },
    {
      name: 'General Aptitude',
      chapters: [{ name: 'Quant', lectures: [{ title: 'Quant 01', durSec: 3600 }, { title: 'Quant 02' }] }],
    },
    {
      name: 'Linear Algebra',
      chapters: [{ name: 'Matrix', lectures: [{ title: 'Matrix 01', durSec: 7200 }] }],
    },
  ],
  tests: [
    { id: 't1', name: 'Mock 01', type: 'Mock', start: '2026-09-01', end: '2026-09-30', marks: 100 },
    { id: 't2', name: 'Mock 02', type: 'Mock', start: '2026-10-20', end: '2026-10-31', marks: 100 },
    { id: 't3', name: 'Mock 03', type: 'Mock', start: '2026-08-01', end: '2026-09-01', marks: 100 },
  ],
  results: [{ testId: 't1', score: 60, max: 100 }],
};
