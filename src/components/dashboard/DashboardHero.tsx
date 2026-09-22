import React from 'react';

import heroImage from '../../assets/knuckles-hero.jpg';

export default function DashboardHero(): React.ReactElement {
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