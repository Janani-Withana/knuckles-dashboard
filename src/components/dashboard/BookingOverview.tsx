import React from 'react';
import { Link } from 'react-router-dom';

import {
  CalendarDays,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import CardHeader from './CardHeader';
import { ROUTES } from '../../routes/paths';
import type { BookingData } from '../../types/dashboard';

type Props = { slices: BookingData[] };

export default function BookingOverview({ slices }: Props): React.ReactElement {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <section className="dashboard-card booking-overview">
      <CardHeader
        icon={CalendarDays}
        title="Booking Overview"
        action={
          <Link className="view-all" to={ROUTES.ADMIN_RESERVATIONS}>
            View all
          </Link>
        }
      />

      <div className="booking-chart-wrapper">
        <div className="donut-container">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="88%"
                paddingAngle={1}
                stroke="white"
                strokeWidth={2}
              >
                {slices.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-center">
            <span>Total Bookings</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="legend-list">
          {slices.length === 0 && <p className="dash-note">No bookings yet.</p>}
          {slices.map((item) => (
            <div
              className="legend-row"
              key={item.name}
            >
              <div className="legend-label">
                <span
                  className="legend-dot"
                  style={{
                    background: item.color,
                  }}
                />

                {item.name}
              </div>

              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}