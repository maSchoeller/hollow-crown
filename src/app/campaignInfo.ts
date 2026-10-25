/** Texts and assets that describe a campaign or a save in the campaign view and on the title screen. */
import { t } from '../i18n';
import { metaFromCampaign, type SaveRecord } from '../persistence/save';
import { ageParts, playtimeParts } from '../ui/format';
import { availableNodes, normalizeCampaign } from '../core';
import { nodeDef } from './state/flow';
import { campaign, data } from './state/session';

/**
 * The two avatar looks of the new-campaign form (art/mockups/characters-s1/rhen_a|b.png). `portrait` is the id
 * stored in `CampaignState.avatar.portrait` (dialogue portrait and board model); `head` the round medallion
 * image built by `pnpm art:build` into `avatars/<head>.webp`.
 */
export const AVATAR_LOOKS = [
  { portrait: 'avatar_a', head: 'rhen_a' },
  { portrait: 'avatar_b', head: 'rhen_b' },
] as const;

/** Medallion image id for a stored avatar portrait; unknown ids fall back to the first look. */
export const avatarHead = (portrait: string): string => (AVATAR_LOOKS.find((l) => l.portrait === portrait) ?? AVATAR_LOOKS[0]).head;

/** Place image behind the full-screen views: the picture of the current home (`content/home/home.yaml`), the camp without a campaign. */
export const homeBackdrop = (): string => `locations/${data.home[campaign.value?.home.kind ?? data.campaign.home].image}`;

/** "Mission 1-3" of a node, without the title behind the dash. */
export function nodeShort(id: string): string {
  try {
    return t(nodeDef(id).titleKey).split('–')[0]!.trim();
  } catch {
    return id;
  }
}

/** Where a save resumes: in a battle, before the next mission, or done. */
export function resumeWhere(rec: SaveRecord): string {
  const c = rec.payload.campaign;
  if (rec.payload.battle) return t('ui.title.where.battle', { node: nodeShort(rec.payload.battle.start.nodeId) });
  const next = availableNodes(data, normalizeCampaign(data, c))[0];
  return next ? t('ui.title.where.before', { node: nodeShort(next.id) }) : t('ui.title.where.end');
}

/** "Continue" line of the title screen. */
export function resumeText(rec: SaveRecord): string {
  const c = rec.payload.campaign;
  return t('ui.title.resume', { name: c.avatar.name, act: metaFromCampaign(c).act, where: resumeWhere(rec) });
}

/** Last completed mission of a save, or "Start". */
export function slotSummary(rec: SaveRecord): string {
  const c = rec.payload.campaign;
  const last = c.completed[c.completed.length - 1];
  return last ? nodeShort(last) : t('ui.save.start');
}

export function formatPlaytime(ms: number): string {
  const { h, m } = playtimeParts(ms);
  return h > 0 ? t('ui.campaign.playtime.hours', { h, m: String(m).padStart(2, '0') }) : t('ui.campaign.playtime.minutes', { m });
}

/** "5 min ago" for an ISO timestamp. */
export function formatAge(iso: string, now = Date.now()): string {
  const { unit, n } = ageParts(now - new Date(iso).getTime());
  return t(`ui.campaign.age.${unit}`, { n });
}
