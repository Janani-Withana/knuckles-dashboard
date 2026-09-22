import React, { useState } from 'react';

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
  X,
} from 'lucide-react';

import type { MenuItem } from '../../types/dashboard';

import brandLogo from '../../assets/knucles-logo.png';

import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps): React.ReactElement {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState('Dashboard');

  const toggleMenu = (label: string) => {
    setOpenMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const selectItem = (label: string) => {
    setActiveItem(label);
    onClose();
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

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
          const hasChildren =
            Boolean(item.children?.length);

          const menuIsOpen =
            openMenus.includes(item.label);

          const isActive =
            activeItem === item.label;

          return (
            <div
              className="nav-group"
              key={item.label}
            >
              <button
                type="button"
                className={`nav-item ${
                  isActive ? 'active' : ''
                } ${menuIsOpen ? 'open' : ''}`}
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.label);
                  } else {
                    selectItem(item.label);
                  }
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

              {hasChildren && menuIsOpen && (
                <div className="nav-children">
                  {item.children?.map((child) => {
                    const childKey =
                      `${item.label}::${child}`;

                    return (
                      <button
                        type="button"
                        key={childKey}
                        className={`nav-child ${
                          activeItem === childKey
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          selectItem(childKey)
                        }
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