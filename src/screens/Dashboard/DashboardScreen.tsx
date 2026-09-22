import React from 'react';

import {
  Users,
  LogOut,
  BedDouble,
  CalendarDays,
} from 'lucide-react';

import DashboardHero from '../../components/dashboard/DashboardHero';
import StatCard from '../../components/dashboard/StatCard';
import BookingOverview from '../../components/dashboard/BookingOverview';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentBookings from '../../components/dashboard/RecentBookings';
import BookingStatus from '../../components/dashboard/BookingStatus';
import RoomAvailability from '../../components/dashboard/RoomAvailability';
import BottomBanner from '../../components/dashboard/BottomBanner';

import './DashboardScreen.css';

export default function DashboardScreen(): React.ReactElement {
  return (
    <div className="dashboard-screen">

      <DashboardHero />

      {/* Statistics */}

      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="Today's Arrivals"
          value={8}
          subtitle="3 pending"
          theme="green"
        />

        <StatCard
          icon={LogOut}
          title="Today's Departures"
          value={5}
          subtitle="2 in progress"
          theme="yellow"
        />

        <StatCard
          icon={BedDouble}
          title="Occupancy Rate"
          value="72%"
          subtitle="45 of 63 rooms"
          theme="blue"
        />

        <StatCard
          icon={CalendarDays}
          title="Pending Bookings"
          value={12}
          subtitle="View all"
          theme="purple"
        />
      </div>

      {/* Top dashboard */}

      <div className="dashboard-grid top-grid">
        <BookingOverview />
        <RevenueOverview />
        <QuickActions />
      </div>

      {/* Bottom dashboard */}

      <div className="dashboard-grid bottom-grid">
        <RecentBookings />
        <BookingStatus />
        <RoomAvailability />
      </div>

      <BottomBanner />

    </div>
  );
}