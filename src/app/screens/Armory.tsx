/**
 * Story 16.18: the armoury in the keep. A 3D full screen (the vault, `render/items/armory.ts`, loaded on demand): the relics and
 * signature weapons of the company stand on a turntable, a mirror of what the troop holds and no store (nothing is put in or taken
 * out). The name plates are DOM stones that the scene sets under their stand; a tap on a piece or a plate opens the weapon view,
 * whose close stone leads back here with the same stand in front. Where the scene cannot load, the plates stand in a plain list.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { armoryOf, locateItem, type ArmoryStand, type CampaignState, type GameData, type UnitRecord } from '../../core';
import { t } from '../../i18n';
import type { ArmoryView } from '../../render/items/armory';
import { itemName, unitName } from '../../ui/components';
import { Icon } from '../../ui/icons';
import { itemImageSrc } from '../../ui/pieces';
import { openWeapon } from '../state/weaponView';
import { campaign, data } from '../state/session';
import { screen } from '../state/screen';
import { settings } from '../state/settings';
import { armorySpecs } from './armoryModel';
import { UnitHead } from './unitArt';
import './Armory.css';

/** What a plate says: its name line and the line below (icon + text, or a head and "carries ..."). */
function plateOf(d: GameData, c: CampaignState, p: ArmoryStand): { name: string; label: string; wearer?: UnitRecord } {
  if (p.kind === 'hidden') return { name: t('ui.armory.kind.relic'), label: t('ui.armory.hidden') };
  if (p.kind === 'reach') {
    const who = d.lieutenants[p.lieutenant];
    return { name: t(`item.${p.def}.name`), label: t('ui.armory.reach', { name: who ? t(who.nameKey) : p.lieutenant, n: p.routs, max: p.max }) };
  }
  const wearer = p.wearer ? c.roster.find((u) => u.id === p.wearer) : undefined;
  return { name: itemName(d, locateItem(c, p.uid)!.inst), label: wearer ? t('ui.armory.worn', { name: unitName(wearer) }) : t(`ui.armory.kind.${p.relic ? 'relic' : 'signature'}`), wearer };
}

export function Armory({ at }: { at?: string }) {
  const c = campaign.value;
  if (!c) return null;
  return <ArmoryBody c={c} at={at} />;
}

function ArmoryBody({ c, at }: { c: CampaignState; at?: string }) {
  const pieces = armoryOf(data, c).pieces;
  const count = pieces.filter((p) => p.kind === 'owned').length;
  // the stands are rebuilt (and their models reloaded) only when what they show changes, not on every campaign change
  const fresh = armorySpecs(data, c, (d) => itemImageSrc(d));
  const specsKey = JSON.stringify(fresh);
  const specs = useMemo(() => fresh, [specsKey]);
  const startAt = Math.max(0, pieces.findIndex((p) => p.kind === 'owned' && p.uid === at));
  const slot = useRef<HTMLDivElement>(null);
  const view = useRef<ArmoryView | null>(null);
  const plates = useRef(new Map<number, HTMLElement>());
  const [front, setFront] = useState(startAt);
  const [failed, setFailed] = useState(false);
  const frontRef = useRef(startAt);
  const latest = useRef({ pieces, specs });
  latest.current = { pieces, specs };

  const back = () => (screen.value = { name: 'camp' });
  const open = (i: number) => {
    const p = latest.current.pieces[i];
    if (p?.kind !== 'owned') return view.current?.goTo(i);
    openWeapon(p.uid, { ...(p.wearer ? { unit: p.wearer } : {}), back: { name: 'armory', at: p.uid } });
  };
  // the Escape key closes the view as the stone does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // the scene: made once, loaded on demand (the first download does not grow)
  useEffect(() => {
    let gone = false;
    let v: ArmoryView | null = null;
    void import('../../render/items/armory')
      .then(({ ArmoryView }) => {
        if (gone || !slot.current) return;
        v = new ArmoryView(
          slot.current,
          data,
          {
            onFront: (i) => {
              frontRef.current = i;
              setFront(i);
            },
            onOpen: open,
          },
          settings.value.quality,
        );
        view.current = v;
        for (const [i, el] of plates.current) v.setPlate(i, el);
        void v.setStands(latest.current.specs, frontRef.current);
      })
      .catch(() => {
        // the scene chunk did not load (offline, app update): the plain list stays
        if (!gone) setFailed(true);
      });
    return () => {
      gone = true;
      v?.dispose();
      view.current = null;
    };
  }, []);

  // the campaign changed under the open screen (a piece worn or moved): the stands follow
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void view.current?.setStands(specs, frontRef.current);
  }, [specs]);

  const plate = (p: ArmoryStand, i: number) => {
    const { name, label, wearer } = plateOf(data, c, p);
    const owned = p.kind === 'owned';
    const cls = `ar-plate ${owned ? (p.wearer ? 'is-worn' : '') : 'is-empty'} ${i === front ? 'is-front' : ''}`;
    const icon = p.kind === 'hidden' ? 'lock' : p.kind === 'owned' && p.relic ? 'star' : 'crown';
    return (
      <button
        key={`${p.kind}:${p.def}:${owned ? p.uid : i}`}
        type="button"
        class={cls}
        ref={(el) => {
          if (el) plates.current.set(i, el);
          else plates.current.delete(i);
          view.current?.setPlate(i, el);
        }}
        aria-label={`${name}, ${label}`}
        onClick={() => open(i)}
      >
        <b>{name}</b>
        <span>
          {wearer ? <UnitHead portrait={wearer.portrait} classId={wearer.classId} name={unitName(wearer)} size={16} /> : <Icon name={icon} size={11} />}
          {label}
        </span>
      </button>
    );
  };

  return (
    <div class={`hc-view ar ${failed ? 'is-list' : ''}`}>
      {!failed && <div class="hc-stage-slot ar-stage" ref={slot} role="img" aria-label={t('ui.armory.stage')} />}
      <header class="hc-head ar-head">
        <button type="button" class="hc-head__back" onClick={back} aria-label={t('ui.armory.back')}>
          <Icon name="back" size={22} />
        </button>
        <h1 class="hc-head__title">
          <Icon name="armory" size={20} />
          <b>{t('ui.armory.title')}</b>
          <span aria-label={t('ui.armory.count', { n: count })}>
            <Icon name="crown" size={13} /> {count}
          </span>
        </h1>
      </header>
      <div class={failed ? 'ar-list' : 'ar-plates'}>{pieces.map(plate)}</div>
      {!failed && <small class="ar-hint">{t('ui.armory.hint')}</small>}
    </div>
  );
}
