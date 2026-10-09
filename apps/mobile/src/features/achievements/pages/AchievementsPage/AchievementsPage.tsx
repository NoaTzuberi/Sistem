import { useCopy } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { SubPageHeader } from '../../../profile/components/SubPageHeader/SubPageHeader';
import { StreakSummary } from '../../components/StreakSummary/StreakSummary';
import { ProgressStats } from '../../components/ProgressStats/ProgressStats';
import { AchievementList } from '../../components/AchievementList/AchievementList';
import { useMyAchievements } from '../../hooks/useMyAchievements';
import { achievementCopy } from '../../copy';
import './AchievementsPage.css';

/** All her achievements (Phase 11): the streak, her numbers, unlocked and still to unlock. */
export function AchievementsPage() {
  const copy = useCopy(achievementCopy);
  const { data, error, reload } = useMyAchievements();

  return (
    <AppShell>
      <div className="achievements-page">
        <SubPageHeader title={copy.allTitle} fallbackPath={ROUTES.PROFILE} />
        {!data && !error && <StateMessage>{copy.loading}</StateMessage>}
        {!data && error && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {data && (
          <>
            <StreakSummary streak={data.streak} />
            <ProgressStats overview={data} />
            <AchievementList progress={data.progress} />
          </>
        )}
      </div>
    </AppShell>
  );
}
