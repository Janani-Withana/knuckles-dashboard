import { useNavigate } from "react-router-dom";
import heroImage from "../../assets/knuckles-hero.jpg";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../routes/paths";

const initialsFor = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase() || "AD";
};

export default function DashboardHero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.fullName?.trim() || "Admin";
  const email = user?.email || "";

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      <div className="hero-overlay" />

      <div className="hero-content">
        <div className="hero-greeting">Good Morning,</div>

        <h1>Welcome to Knuckles Retreat</h1>

        <p>Manage your reservations, services, and daily operations in one place.</p>
      </div>

      <button
        type="button"
        className="hero-user"
        onClick={() => navigate(ROUTES.ADMIN_PROFILE)}
        aria-label="Open profile"
      >
        <div className="hero-user-meta">
          <strong>{name}</strong>
          <span>{email}</span>
        </div>

        <span className="hero-avatar" aria-hidden="true">
          {initialsFor(name, email)}
        </span>
      </button>
    </section>
  );
}
