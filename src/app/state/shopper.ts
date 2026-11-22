/**
 * Who the merchant is shopping for (story 16.17): the figure's id or `CONVOY_SHOPPER`. Remembered over room and session changes
 * (not part of the save); a figure that has left the troop falls back to the first one where it is read.
 */
import { signal } from '@preact/signals';

export const shopper = signal<string | null>(null);
