import type { CoachStats } from '@sistem/types';
import { dateFormat, fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { useAuth } from '../../../../services/auth/AuthContext';
import { overviewCopy } from '../../copy';
import { dayPartAt, formatChange, weekOfYear } from '../../data/overviewFormat';
import './Greeting.css';

interface GreetingProps {
  stats: CoachStats | undefined;
  /** The server's clock. */
  nowMs: number;
}

/** "Good evening, …" in large light type, the week and date, and two numbers with their change. */
export function Greeting({ stats, nowMs }: GreetingProps) {
  const language = useLanguage();
  const copy = useCopy(overviewCopy);
  const { user } = useAuth();
  if (!user) return null;

  const date = dateFormat(language, { weekday: 'long', day: 'numeric', month: 'long', timeZone: user.timezone }).format(nowMs);
  const numbers = stats
    ? [
        { label: copy.activeTrainees, value: stats.summary.activeTrainees, change: stats.summary.activeTraineesChange },
        { label: copy.newThisMonth, value: stats.summary.newTraineesThisMonth, change: stats.summary.newTraineesChange },
      ]
    : [];

  return (
    <header className="greeting">
      <div className="greeting-text">
        <h1 className="greeting-title">{fill(copy.greeting[dayPartAt(nowMs, user.timezone)], { name: user.name })}</h1>
        <p className="greeting-date">{stats ? fill(copy.weekLine, { week: weekOfYear(stats.today), date }) : date}</p>
      </div>
      <dl className="greeting-numbers">
        {numbers.map((number) => {
          const change = formatChange(number.change, language);
          return (
            <div key={number.label} className="greeting-number">
              <dt>{number.label}</dt>
              <dd>
                {formatNumber(number.value, language)}
                {change && (
                  <bdi className="greeting-change" dir="ltr">
                    {change}
                  </bdi>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </header>
  );
}
