import './Sparks.css';

/**
 * Two sparks rising (the ember moment): over a scene's reward line (story 9.9) and over the academy after a promotion
 * (story 10.2). Decorative, a second and a half at most; under reduced motion they stand still as a glow.
 * The crackle of the embers comes with the audio story (EXPERIENCE: Funkenknistern): hook for `audio.sfx('sparks')` here.
 */
export function Sparks() {
  return (
    <div class="vn-sparks" aria-hidden="true">
      <i class="vn-spark vn-spark--a" />
      <i class="vn-spark vn-spark--b" />
    </div>
  );
}
