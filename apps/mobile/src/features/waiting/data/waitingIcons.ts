// The 3D gym & sports icons of the waiting screen (PRD §4.1, §12). The owner provides
// the files. TO SWAP: put each file in features/waiting/assets/, import it here and
// set it as that slot's `src`. A slot with `src: null` shows a numbered placeholder.
// Files are square transparent PNGs (512 px), the model only — no background.

import bench from '../assets/bench.png';
import dumbbell from '../assets/dumbbell.png';
import ezBar from '../assets/ez-bar.png';
import step from '../assets/step.png';

export interface WaitingIcon {
  id: string;
  src: string | null;
}

export const WAITING_ICONS: WaitingIcon[] = [
  { id: 'slot-1', src: ezBar },
  { id: 'slot-2', src: bench },
  { id: 'slot-3', src: dumbbell },
  { id: 'slot-4', src: step },
];
