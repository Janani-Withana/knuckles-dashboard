import React from 'react';

import {
  Zap,
  CalendarCheck,
  UserRound,
  DoorOpen,
  WalletCards,
} from 'lucide-react';

import type {
  QuickActionProps,
} from '../../types/dashboard';

import CardHeader from './CardHeader';

export default function QuickActions(): React.ReactElement {
  return (
    <section className="dashboard-card quick-actions">
      <CardHeader
        icon={Zap}
        title="Quick Actions"
      />

      <div className="quick-grid">
        <QuickAction
          icon={CalendarCheck}
          title="New Booking"
          theme="green"
        />

        <QuickAction
          icon={UserRound}
          title="Add Guest"
          theme="blue"
        />

        <QuickAction
          icon={DoorOpen}
          title="Add Room"
          theme="yellow"
        />

        <QuickAction
          icon={WalletCards}
          title="Add Expense"
          theme="purple"
        />
      </div>
    </section>
  );
}

function QuickAction({
  icon: Icon,
  title,
  theme,
}: QuickActionProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`quick-action ${theme}`}
    >
      <span className="quick-action-icon">
        <Icon size={22} />
      </span>

      <span>{title}</span>
    </button>
  );
}