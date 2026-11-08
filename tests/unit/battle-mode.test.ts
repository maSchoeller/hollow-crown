/**
 * Choosing a unit on the battle screen (src/app/screens/battleMode.ts). Tauschen and Konvoi walk first and stay free actions without an end
 * of turn (GDD Aktionsökonomie): after the sheet is closed without a swap, the unit must still offer its action bar, not a move it no longer has.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, availableActions, type GameData } from '../../src/core';
import { backFromMoved, selectMode } from '../../src/app/screens/battleMode';
import { labState, labUnit } from '../fixtures/lab';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('a unit whose move is done', () => {
  // Tobin walks next to Lucan (convoy) as "Open the convoy" does; the sheet is then closed without a swap
  const walked = () => {
    const { state } = labState(data, 'handy-ansicht');
    return applyCommand(data, state, { type: 'move', unit: labUnit(state, 'tobin').uid, to: [8, 7] }).state;
  };

  it('is still ready and keeps its convoy turn when the sheet is closed', () => {
    const s = walked();
    const tobin = labUnit(s, 'tobin');
    expect(tobin).toMatchObject({ moved: true, acted: false, freeUsed: {} });
    const kinds = availableActions(data, s, tobin, tobin.pos!).map((o) => o.kind);
    expect(kinds).toContain('wait');
    expect(kinds).toContain('convoy');
  });

  it('is chosen straight into its action bar on its own field', () => {
    const tobin = labUnit(walked(), 'tobin');
    expect(selectMode(tobin)).toEqual({ k: 'moved', uid: tobin.uid, to: [8, 7] });
  });

  it('is let go by "Back" instead of offering a destination', () => {
    expect(backFromMoved(labUnit(walked(), 'tobin'))).toEqual({ k: 'idle' });
  });

  it('can still end its turn with an action', () => {
    const s = walked();
    const tobin = labUnit(s, 'tobin');
    const after = applyCommand(data, s, { type: 'act', unit: tobin.uid, to: tobin.pos!, action: { kind: 'wait' } }).state;
    expect(labUnit(after, 'tobin').acted).toBe(true);
  });
});

describe('a unit that has not moved yet', () => {
  it('is chosen into the destination choice, and "Back" returns there', () => {
    const tobin = labUnit(labState(data, 'handy-ansicht').state, 'tobin');
    expect(selectMode(tobin)).toEqual({ k: 'selected', uid: tobin.uid });
    expect(backFromMoved(tobin)).toEqual({ k: 'selected', uid: tobin.uid });
  });
});
