import React from 'react';

import {
  BedDouble,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import CardHeader from './CardHeader';

import {
  roomData,
} from '../../data/dashboardData';

export default function RoomAvailability(): React.ReactElement {
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