import React from 'react';

import {
  CalendarDays,
} from 'lucide-react';

import CardHeader from './CardHeader';

import {
  bookingData,
} from '../../data/dashboardData';

export default function BookingStatus(): React.ReactElement {
  return (
    <section className="dashboard-card booking-status">
      <CardHeader
        icon={CalendarDays}
        title="Booking Status"
        action={
          <select
            className="month-select"
            defaultValue="This Month"
          >
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        }
      />

      <div className="status-list">
        {bookingData.map((item) => {
          const percentage =
            (item.value / 38) * 100;

          return (
            <div
              className="status-item"
              key={item.name}
            >
              <div className="status-item-header">
                <div>
                  <span
                    className="legend-dot"
                    style={{
                      background: item.color,
                    }}
                  />

                  {item.name}
                </div>

                <strong>
                  {item.value}
                </strong>
              </div>

              <div className="status-progress">
                <span
                  style={{
                    width: `${Math.min(
                      percentage,
                      100,
                    )}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}