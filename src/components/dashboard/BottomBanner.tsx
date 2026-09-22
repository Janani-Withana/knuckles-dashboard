import React from 'react';

import {
  CalendarCheck,
  UserRound,
  BarChart3,
  Settings,
  ArrowUpRight,
} from 'lucide-react';

export default function BottomBanner(): React.ReactElement {
  return (
    <section className="bottom-banner">
      <div className="bottom-banner-overlay" />

      <div className="bottom-banner-content">
        <div>
          <h3>
            Experience the tranquility
            of Knuckles
          </h3>

          <p>
            Where nature meets comfort
          </p>
        </div>

        <div className="banner-links">
          <button type="button">
            <CalendarCheck size={17} />
            View Bookings
            <ArrowUpRight size={14} />
          </button>

          <button type="button">
            <UserRound size={17} />
            Guest Search
            <ArrowUpRight size={14} />
          </button>

          <button type="button">
            <BarChart3 size={17} />
            Reports
            <ArrowUpRight size={14} />
          </button>

          <button type="button">
            <Settings size={17} />
            Settings
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}