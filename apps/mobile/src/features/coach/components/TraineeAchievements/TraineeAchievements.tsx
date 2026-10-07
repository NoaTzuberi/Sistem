import { useCallback } from 'react';
import { useLoad } from '@sistem/shared';
import { getTraineeAchievements } from '../../../../services/coach/coachService';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { StreakSummary } from '../../../achievements/components/StreakSummary/StreakSummary';
import { ProgressStats } from '../../../achievements/components/ProgressStats/ProgressStats';
import { AchievementList } from '../../../achievements/components/AchievementList/AchievementList';
import { ACHIEVEMENT_COPY } from '../../../achievements/data/achievementCopy';
import './TraineeAchievements.css';

interface TraineeAchievementsProps {
  traineeId: string;
}

/** The Achievements tab (coach mode): her streak, numbers and achievements — her own views, read-only. */
export function TraineeAchievements({ traineeId }: TraineeAchievementsProps) {
  const load = useCallback(() => getTraineeAchievements(traineeId), [traineeId]);
  const { data, error, reload } = useLoad(load, ACHIEVEMENT_COPY.loadError);

  if (!data && error) return <StateMessage onRetry={reload}>{error}</StateMessage>;
  if (!data) return <StateMessage>{ACHIEVEMENT_COPY.loading}</StateMessage>;
  return (
    <div className="trainee-achievements">
      <StreakSummary streak={data.streak} />
      <ProgressStats overview={data} />
      <AchievementList progress={data.progress} />
    </div>
  );
}
