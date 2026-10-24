/**
 * Saving out of battle (stories 1.5, 5.3): manual slots in Standard and Casual, export of every slot and the
 * auto-save. Opened from the round menu of the world map (product owner 2026-10-24).
 */
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { Icon } from '../../ui/icons';
import { SecondaryButton } from '../../ui/pieces';
import { Sheet } from '../../ui/Sheet';
import { listSaves, type SaveRecord } from '../../persistence/save';
import { campaign, campaignId, saveSlot } from '../state/session';
import { downloadSave, SlotPicker } from './Menus';

export function SaveSheet({ onClose, onToast }: { onClose: () => void; onToast: (s: string) => void }) {
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [picker, setPicker] = useState(false);
  const classic = campaign.value?.settings.deathMode === 'classic';
  const refresh = () => void (campaignId.value ? listSaves(campaignId.value).then(setSaves) : setSaves([]));
  useEffect(refresh, []);
  const auto = saves.find((s) => s.slot === 'auto');
  return (
    <Sheet title={t('ui.save.title')} onClose={onClose}>
      <div class="save-sheet">
        <p class="muted">{t('ui.battle.autosaved')}</p>
        {classic ? (
          <p class="muted">{t('ui.save.classic')}</p>
        ) : (
          <SecondaryButton onClick={() => setPicker(true)}>
            <Icon name="save" size={18} /> {t('ui.save.title')}
          </SecondaryButton>
        )}
        {saves
          .filter((s) => s.slot !== 'auto')
          .map((s) => (
            <SecondaryButton key={s.slot} onClick={() => downloadSave(s)}>
              <Icon name="download" size={18} /> {t('ui.save.export')} {t('ui.save.slot')} {s.slot}
            </SecondaryButton>
          ))}
        {auto && (
          <SecondaryButton onClick={() => downloadSave(auto)}>
            <Icon name="download" size={18} /> {t('ui.save.export')} ({t('ui.save.auto')})
          </SecondaryButton>
        )}
      </div>
      {picker && (
        <SlotPicker
          save
          saves={saves}
          onClose={() => setPicker(false)}
          onPick={(slot) => {
            void saveSlot(slot).then(
              () => {
                setPicker(false);
                refresh();
                onToast(t('ui.save.done'));
              },
              () => {
                setPicker(false);
                onToast(t('ui.save.failed'));
              },
            );
          }}
        />
      )}
    </Sheet>
  );
}
