import React from "react";

import { CalendarDays } from "lucide-react";

import CardHeader from "./CardHeader";
import type { BookingData } from "../../types/dashboard";

export default function BookingStatus({ slices }: { slices: BookingData[] }): React.ReactElement {
  const peak = Math.max(...slices.map((item) => item.value), 1);
  return (
    <section className="dashboard-card booking-status">
      <CardHeader
        icon={CalendarDays}
        title="Booking Status"
      />

      <div className="status-list">
        {slices.length === 0 && <p className="dash-note">No bookings yet.</p>}
        {slices.map((item) => {
          const percentage = (item.value / peak) * 100;

          return (
            <div className="status-item" key={item.name}>
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

                <strong>{item.value}</strong>
              </div>

              <div className="status-progress">
                <span
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
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
