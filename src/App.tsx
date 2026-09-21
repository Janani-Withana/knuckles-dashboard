import React, { useState, type ComponentType } from 'react';

import {
  LayoutDashboard,
  ChartPie,
  Building2,
  BedDouble,
  CalendarDays,
  Users,
  BriefcaseBusiness,
  CircleDollarSign,
  UserRoundCog,
  BarChart3,
  Settings,
  ChevronRight,
  WalletCards,
  LogOut,
  ArrowUpRight,
  CalendarCheck,
  UserRound,
  DoorOpen,
  Zap,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import './App.css';
import heroImage from './assets/knuckles-hero.jpg';
import brandLogo from './assets/knucles-logo.png';

/* =====================================================
   TYPES
===================================================== */

interface BookingData {
  name: string;
  value: number;
  color: string;
}

interface RevenueData {
  day: string;
  revenue: number;
}

interface RecentBooking {
  name: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  image: string;
}

interface RoomData {
  name: string;
  value: number;
  color: string;
}

type BookingStatus =
  | 'Confirmed'
  | 'Pending'
  | 'Checked In'
  | 'Completed'
  | 'Cancelled';

type Theme =
  | 'green'
  | 'yellow'
  | 'blue'
  | 'purple';

interface MenuItem {
  label: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  children?: string[];
}

interface StatCardProps {
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  title: string;
  value: string | number;
  subtitle: string;
  theme: Theme;
  arrow?: boolean;
}

interface QuickActionProps {
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  title: string;
  theme: Theme;
}

interface CardHeaderProps {
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  title: string;
  action?: React.ReactNode;
}

interface StatusBadgeProps {
  status: BookingStatus;
}

/* =====================================================
   DATA
===================================================== */

const bookingData: BookingData[] = [
  {
    name: 'Pending',
    value: 12,
    color: '#F2A52B',
  },
  {
    name: 'Confirmed',
    value: 38,
    color: '#5A9D85',
  },
  {
    name: 'Checked In',
    value: 24,
    color: '#4E91D5',
  },
  {
    name: 'Completed',
    value: 16,
    color: '#8B7BA7',
  },
  {
    name: 'Cancelled',
    value: 4,
    color: '#EA5D5D',
  },
];

const revenueData: RevenueData[] = [
  { day: '1', revenue: 3000 },
  { day: '2', revenue: 4700 },
  { day: '3', revenue: 3500 },
  { day: '4', revenue: 2400 },
  { day: '5', revenue: 2700 },
  { day: '6', revenue: 4500 },
  { day: '7', revenue: 5000 },
  { day: '8', revenue: 2700 },
  { day: '9', revenue: 2300 },
  { day: '10', revenue: 4000 },
  { day: '11', revenue: 4300 },
  { day: '12', revenue: 5200 },
  { day: '13', revenue: 6800 },
  { day: '14', revenue: 4500 },
  { day: '15', revenue: 3200 },
  { day: '16', revenue: 2900 },
  { day: '17', revenue: 4200 },
  { day: '18', revenue: 3100 },
  { day: '19', revenue: 2800 },
  { day: '20', revenue: 3400 },
  { day: '21', revenue: 4100 },
  { day: '22', revenue: 4300 },
  { day: '23', revenue: 4500 },
  { day: '24', revenue: 4500 },
  { day: '25', revenue: 5600 },
  { day: '26', revenue: 3400 },
  { day: '27', revenue: 6800 },
  { day: '28', revenue: 5400 },
  { day: '29', revenue: 4200 },
  { day: '30', revenue: 3900 },
];

const recentBookings: RecentBooking[] = [
  {
    name: 'John Mitchell',
    room: 'Deluxe Room 02',
    checkIn: 'Apr 25, 2025',
    checkOut: 'Apr 27, 2025',
    status: 'Confirmed',
    image: 'https://i.pravatar.cc/100?img=12',
  },
  {
    name: 'Emma Watson',
    room: 'Standard Room 05',
    checkIn: 'Apr 26, 2025',
    checkOut: 'Apr 28, 2025',
    status: 'Pending',
    image: 'https://i.pravatar.cc/100?img=47',
  },
  {
    name: 'Liam Carter',
    room: 'Suite 01',
    checkIn: 'Apr 26, 2025',
    checkOut: 'Apr 30, 2025',
    status: 'Checked In',
    image: 'https://i.pravatar.cc/100?img=11',
  },
  {
    name: 'Olivia Bennett',
    room: 'Deluxe Room 04',
    checkIn: 'Apr 27, 2025',
    checkOut: 'Apr 29, 2025',
    status: 'Confirmed',
    image: 'https://i.pravatar.cc/100?img=32',
  },
  {
    name: 'Noah Taylor',
    room: 'Standard Room 08',
    checkIn: 'Apr 28, 2025',
    checkOut: 'May 01, 2025',
    status: 'Pending',
    image: 'https://i.pravatar.cc/100?img=15',
  },
];

const roomData: RoomData[] = [
  {
    name: 'Available',
    value: 45,
    color: '#5CA36D',
  },
  {
    name: 'Occupied',
    value: 18,
    color: '#4288CA',
  },
  {
    name: 'Blocked',
    value: 4,
    color: '#F3A326',
  },
  {
    name: 'Maintenance',
    value: 2,
    color: '#EA5D5D',
  },
];

/* =====================================================
   SIDEBAR DATA
===================================================== */

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Overview',
    icon: ChartPie,
  },
  {
    label: 'Property',
    icon: Building2,
    children: [
      'Property Details',
      'Property Settings',
    ],
  },
  {
    label: 'Accommodation',
    icon: BedDouble,
    children: [
      'Accommodation Types',
      'Rooms / Units',
      'Availability',
      'Meal Plans',
      'Rate Plans & Pricing',
    ],
  },
  {
    label: 'Reservations',
    icon: CalendarDays,
    children: [
      'All Bookings',
      'Booking Calendar',
      'Pending',
      'Confirmed',
      'Checked In',
      'Checked Out',
      'Cancelled',
    ],
  },
  {
    label: 'Guests',
    icon: Users,
    children: [
      'All Guests',
      'Guest Search',
      'Guest Documents',
      'Preferences',
      'Booking History',
    ],
  },
  {
    label: 'Front Desk',
    icon: BriefcaseBusiness,
    children: [
      "Today's Arrivals",
      "Today's Departures",
      'Check-In',
      'Check-Out',
      'Room Assignment',
    ],
  },
  {
    label: 'Finance',
    icon: CircleDollarSign,
    children: [
      'Charges',
      'Payments',
      'Invoices',
      'Expenses',
      'Utility Bills',
      'Other Income',
    ],
  },
  {
    label: 'Staff',
    icon: UserRoundCog,
    children: [
      'Staff',
      'Work Logs',
      'Staff Payments',
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      'Monthly Summary',
      'Booking Revenue',
      'Booking Profitability',
      'Guest Profitability',
      'Occupancy',
      'Payment Summary',
      'Outstanding Balances',
      'Expenses',
      'Utilities',
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      'Staff & Roles',
      'Permissions',
      'Property Settings',
    ],
  },
];

/* =====================================================
   SIDEBAR
===================================================== */

function Sidebar(): React.ReactElement {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState('Dashboard');

  function toggleMenu(label: string) {
    setOpenMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand-logo">
          <img
            src={brandLogo}
            alt="Knuckles Retreat"
          />
        </div>

        <div className="brand-name">
          Knuckles Retreat
        </div>

        <div className="brand-tagline">
          -RECONNECT WITH NATURE-
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const isOpen = openMenus.includes(item.label);
          const isActive = activeItem === item.label;

          return (
            <div
              className="nav-group"
              key={item.label}
            >
              <button
                type="button"
                className={`nav-item${isActive ? ' active' : ''}${isOpen ? ' open' : ''}`}
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.label);
                    return;
                  }

                  setActiveItem(item.label);
                }}
              >
                <Icon
                  size={21}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>

                {hasChildren && (
                  <ChevronRight
                    className="nav-arrow"
                    size={17}
                  />
                )}
              </button>

              {hasChildren && isOpen && (
                <div className="nav-children">
                  {item.children?.map((child) => {
                    const childKey = `${item.label}::${child}`;

                    return (
                      <button
                        type="button"
                        className={`nav-child${activeItem === childKey ? ' active' : ''}`}
                        key={childKey}
                        onClick={() => setActiveItem(childKey)}
                      >
                        {child}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Knuckles Retreat</div>
        <div>Hotel Management System</div>
        <div>v1.0.0</div>
      </div>
    </aside>
  );
}

/* =====================================================
   HERO
===================================================== */

function Hero(): React.ReactElement {
  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="hero-overlay" />

      <div className="hero-content">
        <div className="hero-greeting">
          Good Morning,
        </div>

        <h1>
          Welcome to Knuckles Retreat
        </h1>

        <p>
          Your gateway to a serene experience
        </p>
      </div>

      <div className="hero-user">
        <div className="hero-user-meta">
          <strong>Admin</strong>
          <span>Hotel Manager</span>
        </div>

        <img
          src="https://i.pravatar.cc/100?img=33"
          alt="Admin"
        />
      </div>
    </section>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  theme,
  arrow = true,
}: StatCardProps): React.ReactElement {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${theme}`}>
        <Icon size={24} />
      </div>

      <div className="stat-content">
        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-subtitle">
          {subtitle}
        </div>
      </div>

      {arrow && (
        <ChevronRight
          className="stat-arrow"
          size={17}
        />
      )}
    </div>
  );
}

/* =====================================================
   CARD HEADER
===================================================== */

function CardHeader({
  icon: Icon,
  title,
  action,
}: CardHeaderProps): React.ReactElement {
  return (
    <div className="card-header">
      <div className="card-title">
        <Icon size={21} />

        <h2>{title}</h2>
      </div>

      {action &&
        (typeof action === 'string' ? (
          <button
            type="button"
            className="view-all"
          >
            {action}
          </button>
        ) : (
          action
        ))}
    </div>
  );
}

/* =====================================================
   BOOKING OVERVIEW
===================================================== */

function BookingOverview(): React.ReactElement {
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

/* =====================================================
   REVENUE OVERVIEW
===================================================== */

function RevenueOverview(): React.ReactElement {
  return (
    <section className="dashboard-card revenue-card">
      <CardHeader
        icon={BarChart3}
        title="Revenue Overview"
        action={
          <select
            className="month-select"
            defaultValue="This Month"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        }
      />

      <div className="revenue-number">
        <span>$</span>

        24,580

        <div className="growth">
          <ArrowUpRight size={17} />
          12%
        </div>

        <small>
          vs. last month
        </small>
      </div>

      <div className="revenue-chart">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={revenueData}
            margin={{
              top: 10,
              right: 0,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="2 3"
              vertical={false}
              stroke="#E9ECEB"
            />

            <XAxis
              dataKey="day"
              tick={{
                fontSize: 10,
                fill: '#697776',
              }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />

            <YAxis
              tick={{
                fontSize: 10,
                fill: '#697776',
              }}
              axisLine={false}
              tickLine={false}
              ticks={[
                0,
                2000,
                4000,
                6000,
                8000,
              ]}
              tickFormatter={(value: number) =>
                value === 0
                  ? '0'
                  : `${value / 1000}K`
              }
            />

            <Tooltip />

            <Bar
              dataKey="revenue"
              fill="#4D896B"
              radius={[4, 4, 0, 0]}
              barSize={7}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* =====================================================
   QUICK ACTIONS
===================================================== */

function QuickActions(): React.ReactElement {
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

/* =====================================================
   QUICK ACTION
===================================================== */

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

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: StatusBadgeProps): React.ReactElement {
  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <span
      className={`status-badge ${statusClass}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   RECENT BOOKINGS
===================================================== */

function RecentBookings(): React.ReactElement {
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

        {recentBookings.map(
          (booking) => (
            <div
              className="table-row"
              key={booking.name}
            >
              <div className="guest-cell">
                <img
                  src={booking.image}
                  alt={booking.name}
                />

                <span>
                  {booking.name}
                </span>
              </div>

              <span>
                {booking.room}
              </span>

              <span>
                {booking.checkIn}
              </span>

              <span>
                {booking.checkOut}
              </span>

              <StatusBadge
                status={booking.status}
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =====================================================
   BOOKING STATUS
===================================================== */

function BookingStatus(): React.ReactElement {
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
                      background:
                        item.color,
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
                      100
                    )}%`,
                    background:
                      item.color,
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

/* =====================================================
   ROOM AVAILABILITY
===================================================== */

function RoomAvailability(): React.ReactElement {
  return (
    <section className="dashboard-card room-availability">
      <CardHeader
        icon={BedDouble}
        title="Room Availability"
        action="View all"
      />

      <div className="room-content">
        <div className="room-donut">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={roomData}
                dataKey="value"
                innerRadius="67%"
                outerRadius="90%"
                paddingAngle={1}
                stroke="white"
                strokeWidth={2}
              >
                {roomData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="room-donut-center">
            <strong>45</strong>

            <span>Available</span>
            <span>Rooms</span>
          </div>
        </div>

        <div className="room-legend">
          {roomData.map((item) => (
            <div
              className="room-legend-row"
              key={item.name}
            >
              <div>
                <span
                  className="legend-dot"
                  style={{
                    background:
                      item.color,
                  }}
                />

                {item.name}
              </div>

              <strong>
                {item.value}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================
   BOTTOM BANNER
===================================================== */

function BottomBanner(): React.ReactElement {
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

/* =====================================================
   APP
===================================================== */

function App(): React.ReactElement {
  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        <div className="content">
          <Hero />

          {/* ================================
              STATISTICS
          ================================= */}

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

          {/* ================================
              TOP DASHBOARD
          ================================= */}

          <div className="dashboard-grid top-grid">
            <BookingOverview />

            <RevenueOverview />

            <QuickActions />
          </div>

          {/* ================================
              BOTTOM DASHBOARD
          ================================= */}

          <div className="dashboard-grid bottom-grid">
            <RecentBookings />

            <BookingStatus />

            <RoomAvailability />
          </div>

          <BottomBanner />
        </div>
      </main>
    </div>
  );
}

export default App;