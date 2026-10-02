import React from 'react';
import { Link } from 'react-router-dom';

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
import { ROUTES } from '../../routes/paths';

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
          to={ROUTES.ADMIN_RESERVATION_NEW}
        />

        <QuickAction
          icon={UserRound}
          title="Add Staff"
          theme="blue"
          to={ROUTES.ADMIN_STAFF_NEW}
        />

        <QuickAction
          icon={DoorOpen}
          title="Add Room"
          theme="yellow"
          to={ROUTES.ADMIN_ROOMS}
        />

        <QuickAction
          icon={WalletCards}
          title="Add Expense"
          theme="purple"
          to={ROUTES.ADMIN_FINANCE_EXPENSES}
        />
      </div>
    </section>
  );
}

function QuickAction({
  icon: Icon,
  title,
  theme,
  to,
}: QuickActionProps): React.ReactElement {
  return (
    <Link
      to={to}
      className={`quick-action ${theme}`}
    >
      <span className="quick-action-icon">
        <Icon size={22} />
      </span>

      <span>{title}</span>
    </Link>
  );
}