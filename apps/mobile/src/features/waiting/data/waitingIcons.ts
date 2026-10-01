// The 3D gym & sports icons of the waiting screen (PRD §4.1, §12). The owner provides
// the files. TO SWAP: put each file in features/waiting/assets/, import it here and
// set it as that slot's `src`. A slot with `src: null` shows a numbered placeholder.
//
//   import dumbbell from '../assets/dumbbell.png';
//   { id: 'slot-1', src: dumbbell },

export interface WaitingIcon {
  id: string;
  src: string | null;
}

export const WAITING_ICONS: WaitingIcon[] = [
  { id: 'slot-1', src: null },
  { id: 'slot-2', src: null },
  { id: 'slot-3', src: null },
  { id: 'slot-4', src: null },
];
