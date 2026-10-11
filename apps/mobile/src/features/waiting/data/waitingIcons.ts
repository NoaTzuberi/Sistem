// The 3D gym & sports icons of the waiting screen (PRD §4.1, §12). The owner provides
// the files. TO SWAP: put each file in features/waiting/assets/, import it here and
// set it as that slot's `src`. A slot with `src: null` shows a numbered placeholder.
// Files are square transparent PNGs (512 px), the model only — no background.

import bench from '../assets/bench.png';
import dumbbell from '../assets/dumbbell.png';
import ezBar from '../assets/ez-bar.png';
import step from '../assets/step.png';

export interface WaitingIcon {
  /** Also the CSS hook: `.waiting-item-<id>` places the item (WaitingPage.css). */
  id: string;
  src: string | null;
  /** The screen edge the item runs off and flies in from — a device side, the same in Hebrew and English. */
  side: 'left' | 'right';
}

// Order = the order they fly in.
export const WAITING_ICONS: WaitingIcon[] = [
  { id: 'dumbbell', src: dumbbell, side: 'left' },
  { id: 'ez-bar', src: ezBar, side: 'right' },
  { id: 'step', src: step, side: 'left' },
  { id: 'bench', src: bench, side: 'right' },
];
