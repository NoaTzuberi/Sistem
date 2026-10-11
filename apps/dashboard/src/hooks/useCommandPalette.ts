import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchByText, sharedCopy, useCopy } from '@sistem/shared';
import { NEW_PLAN_STATE, traineePath } from '../app/config/routes';
import { appCopy } from '../copy';
import { traineesCopy } from '../features/trainees/copy';
import { useTraineeDrawer } from '../features/trainees/hooks/useTraineeDrawer';
import { useCoachData } from '../services/coach/CoachDataContext';
import { useNavigation } from './useNavigation';

/** search = trainees, screens and actions · newPlan = pick the trainee the new plan is for. */
export type PaletteMode = 'search' | 'newPlan';

export interface PaletteResult {
  id: string;
  label: string;
  /** A quiet word at the end of the row (a trainee's status). */
  hint?: string;
  /** User text (a name) takes its direction from its own letters. */
  isUserText?: boolean;
  run: () => void;
}

export interface PaletteSection {
  id: string;
  title: string;
  results: PaletteResult[];
}

interface CommandPaletteOptions {
  mode: PaletteMode;
  onClose: () => void;
  onModeChange: (mode: PaletteMode) => void;
}

/** ⌘K: what the palette lists for the typed text, and its keyboard (arrows, Enter, Esc). */
export function useCommandPalette({ mode, onClose, onModeChange }: CommandPaletteOptions) {
  const copy = useCopy(appCopy);
  const shared = useCopy(sharedCopy);
  const trainee = useCopy(traineesCopy);
  const navigate = useNavigate();
  const { trainees } = useCoachData();
  const { groups } = useNavigation();
  const { openDrawer } = useTraineeDrawer();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // A new mode starts clean: "New plan" swaps the list for the trainees only.
  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
  }, [mode]);

  const sections = useMemo<PaletteSection[]>(() => {
    const people: PaletteResult[] = trainees.map((person) => ({
      id: `trainee-${person.id}`,
      label: person.name,
      hint: shared.traineeStatus.labels[person.status],
      isUserText: true,
      run:
        mode === 'newPlan'
          ? () => {
              onClose();
              navigate(traineePath(person.id, 'plans'), { state: NEW_PLAN_STATE });
            }
          : () => {
              onClose();
              openDrawer(person.id);
            },
    }));
    const screens: PaletteResult[] = groups
      .flatMap((group) => group.items)
      .map((item) => ({
        id: `screen-${item.id}`,
        label: item.label,
        run: () => {
          onClose();
          navigate(item.to);
        },
      }));
    const actions: PaletteResult[] = [{ id: 'action-new-plan', label: trainee.newPlan, run: () => onModeChange('newPlan') }];

    const all: PaletteSection[] =
      mode === 'newPlan'
        ? [{ id: 'trainees', title: shared.coach.traineesTitle, results: people }]
        : [
            { id: 'trainees', title: shared.coach.traineesTitle, results: people },
            { id: 'screens', title: copy.palette.screens, results: screens },
            { id: 'actions', title: copy.palette.actions, results: actions },
          ];
    return all
      .map((section) => ({ ...section, results: searchByText(section.results, query, (result) => result.label) }))
      .filter((section) => section.results.length > 0);
  }, [trainees, groups, mode, query, shared, copy, trainee, navigate, openDrawer, onClose, onModeChange]);

  const results = useMemo(() => sections.flatMap((section) => section.results), [sections]);
  const selected = Math.min(selectedIndex, Math.max(0, results.length - 1));

  function changeQuery(next: string) {
    setQuery(next);
    setSelectedIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // The palette's Esc must not also close the drawer under it.
      event.stopPropagation();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(Math.min(results.length - 1, selected + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(Math.max(0, selected - 1));
    } else if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      results[selected].run();
    }
  }

  return { query, changeQuery, sections, results, selectedIndex: selected, setSelectedIndex, handleKeyDown };
}
