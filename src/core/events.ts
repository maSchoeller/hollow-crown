import type { Element, Pos, Stats, StatusId, Team } from './defs';
import type { ItemInstance } from './state';

/** Events produced by the core. The renderer plays them as animations; the UI reads the new state. */
export type GameEvent =
  | { t: 'moved'; unit: string; path: Pos[] }
  | { t: 'combat'; attacker: string; defender: string; weapon?: string }
  | {
      t: 'strike';
      attacker: string;
      defender: string;
      hit: boolean;
      crit: boolean;
      dmg: number;
      hpAfter: number;
      element?: Element;
      tandem?: boolean;
      guarded?: string;
      skill?: string;
      ranged: boolean;
      magic: boolean;
    }
  | { t: 'combatEnd'; attacker: string; defender: string }
  | { t: 'status'; unit: string; status: StatusId; on: boolean }
  | { t: 'knockback'; unit: string; from: Pos; to: Pos; blocked: boolean }
  | { t: 'terrain'; at: Pos; terrain: string; cause: 'ignite' | 'spread' | 'burnout' | 'extinguish' | 'rockwall' | 'raze' }
  | { t: 'damage'; unit: string; amount: number; hpAfter: number; cause: 'burn' | 'fire' | 'item' }
  | { t: 'heal'; unit: string; amount: number; hpAfter: number; by?: string; cause: 'staff' | 'item' | 'terrain' | 'skill' }
  | { t: 'downed'; unit: string }
  /** a downed unit bleeds one more own phase; `turns` of `max`, at `max` it dies (a `died` event follows) */
  | { t: 'bleed'; unit: string; turns: number; max: number }
  | { t: 'died'; unit: string }
  | { t: 'retreated'; unit: string }
  | { t: 'rescued'; unit: string; by: string }
  | { t: 'escaped'; unit: string }
  | { t: 'exp'; unit: string; amount: number; before: number; after: number; capped?: true }
  | { t: 'levelUp'; unit: string; level: number; gains: Partial<Stats> }
  | { t: 'mastered'; unit: string; skill: string }
  | { t: 'loot'; unit: string; item: ItemInstance; toConvoy: boolean }
  | { t: 'lootDropped'; at: Pos; item: ItemInstance }
  | { t: 'gold'; amount: number }
  | { t: 'material'; id: string; amount: number }
  | { t: 'visited'; unit: string; object: string }
  | { t: 'opened'; unit: string; object: string }
  | { t: 'razed'; unit: string; object: string }
  | { t: 'recruited'; unit: string; by?: string }
  | { t: 'dialogue'; id: string }
  | { t: 'quote'; unit: string; id: string }
  | { t: 'spawned'; unit: string; reinforcement: boolean }
  | { t: 'phase'; phase: Team; turn: number }
  | { t: 'exhausted'; unit: string }
  | { t: 'refreshed'; unit: string; by: string }
  | { t: 'rally'; unit: string; affected: string[] }
  /** a class action of story 2.3 was used (`target` = the rescued or cheered unit, or the aimed-at foe) */
  | { t: 'classAction'; unit: string; action: 'aim' | 'farRescue' | 'cheer'; target: string }
  /** Wirken (story 2.5) on a tile; the effects follow as `terrain` and `status` events */
  | { t: 'classAction'; unit: string; action: 'cast'; at: Pos; element: Element }
  | { t: 'support'; a: string; b: string; points: number }
  | { t: 'itemUsed'; unit: string; item: string; target?: string }
  | { t: 'equipped'; unit: string; item: string }
  | { t: 'seized'; unit: string }
  | { t: 'objective'; id: string; done: boolean }
  | { t: 'battleEnd'; outcome: 'victory' | 'defeat'; reason?: string }
  | { t: 'aiTurn'; unit: string }
  | { t: 'promoted'; unit: string; classId: string };
