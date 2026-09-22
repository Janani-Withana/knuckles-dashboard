import type {
  BookingData,
  RevenueData,
  RecentBooking,
  RoomData,
} from '../types/dashboard';

export const bookingData: BookingData[] = [
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

export const revenueData: RevenueData[] = [
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
  { day: '21', revenue: 4300 },
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

export const recentBookings: RecentBooking[] = [
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

export const roomData: RoomData[] = [
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