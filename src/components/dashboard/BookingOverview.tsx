import React from 'react';

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

import { bookingData } from '../../data/dashboardData';

export default function BookingOverview(): React.ReactElement {
  return (
    <section className="dashboard-card booking-overview">
      <CardHeader
        icon={CalendarDays}
        title="Booking Overview"
        action="View all"
      />

      <div className="booking-chart-wrapper">
        <div className="donut-container">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={bookingData}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="88%"
                paddingAngle={1}
                stroke="white"
                strokeWidth={2}
              >
                {bookingData.map((entry) => (
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
            <strong>87</strong>
          </div>
        </div>

        <div className="legend-list">
          {bookingData.map((item) => (
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