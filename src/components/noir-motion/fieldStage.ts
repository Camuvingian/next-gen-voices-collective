/** The landscape shape the waves are drawn for (a desktop hero is about 1440×900). */
const STAGE_ASPECT = 1.6;
/** A portrait box shows at least this much stage width per unit of its height. */
const MIN_COVER = 0.9;

/**
 * Where HarmonicField draws its waves for a box of w×h px.
 *
 * The waves fit a set number of cycles across the stage and scale their height
 * by `v`. When the box is landscape (desktop), the stage is the box. When it is
 * portrait (a phone), it is wider than the box and cropped evenly on both sides,
 * like object-fit: cover, and `v` is capped to the stage's landscape shape, so
 * the waves keep their desktop proportions instead of being squashed sideways.
 */
export function fieldStage(w: number, h: number) {
  const width = Math.max(w, h * MIN_COVER);
  return { width, v: Math.min(h, width / STAGE_ASPECT), offset: (width - w) / 2 };
}
