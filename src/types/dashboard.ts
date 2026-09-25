import type { ComponentType, ReactNode } from 'react';

export interface BookingData {
  name: string;
  value: number;
  color: string;
}

export interface RevenueData {
  day: string;
  revenue: number;
}

export interface RecentBooking {
  name: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  image: string;
}

export interface RoomData {
  name: string;
  value: number;
  color: string;
}

export interface FinanceData {
  totalRevenue: number;
  income: number;
  totalExpenses: number;
  totalBookings: number;
  lastMonthRevenue: number;
  thisMonthRevenue: number;
}

export type BookingStatus =
  | 'Confirmed'
  | 'Pending'
  | 'Checked In'
  | 'Completed'
  | 'Cancelled';

export type Theme =
  | 'green'
  | 'yellow'
  | 'blue'
  | 'purple';

export interface MenuItem {
  label: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  children?: string[];
}

export interface StatCardProps {
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

export interface QuickActionProps {
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  title: string;
  theme: Theme;
}

export interface CardHeaderProps {
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  title: string;
  action?: ReactNode;
}

export interface StatusBadgeProps {
  status: BookingStatus;
}