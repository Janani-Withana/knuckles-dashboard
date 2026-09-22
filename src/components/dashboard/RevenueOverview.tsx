import React from 'react';

import {
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import CardHeader from './CardHeader';

import { revenueData } from '../../data/dashboardData';

export default function RevenueOverview(): React.ReactElement {
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

        <small>vs. last month</small>
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