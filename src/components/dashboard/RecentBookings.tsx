import React from 'react';

import {
  CalendarDays,
} from 'lucide-react';

import CardHeader from './CardHeader';
import StatusBadge from './StatusBadge';

import {
  recentBookings,
} from '../../data/dashboardData';

export default function RecentBookings(): React.ReactElement {
  return (
    <section className="dashboard-card recent-bookings">
      <CardHeader
        icon={CalendarDays}
        title="Recent Bookings"
        action="View all"
      />

      <div className="booking-table">
        <div className="table-header">
          <span>Guest Name</span>
          <span>Room</span>
          <span>Check In</span>
          <span>Check Out</span>
          <span>Status</span>
        </div>

        {recentBookings.map((booking) => (
          <div
            className="table-row"
            key={booking.name}
          >
            <div className="guest-cell">
              <img
                src={booking.image}
                alt={booking.name}
              />

              <span>{booking.name}</span>
            </div>

            <span>{booking.room}</span>
            <span>{booking.checkIn}</span>
            <span>{booking.checkOut}</span>

            <StatusBadge
              status={booking.status}
            />
          </div>
        ))}
      </div>
    </section>
  );
}