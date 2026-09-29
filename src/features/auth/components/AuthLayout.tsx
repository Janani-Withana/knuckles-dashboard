import type { ReactNode } from "react";
import heroImage from "../../assets/knuckles-hero.jpg";
// import mandala from "../../assets/mandala-art.png";
import logo from "../../assets/Knuckles logo.jpeg";
import "./AuthLayout.css";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      {/* Background photograph with slow ken-burns drift */}
      <div
        className="auth-bg"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
      <div className="auth-scrim" aria-hidden="true" />

      {/* Ambient mandala motif, anchored to the frame's edge */}
      {/* <img src={mandala} alt="" className="auth-mandala" aria-hidden="true" /> */}

      {/* Brand mark, top-left, outside the card */}
      <div className="auth-brand">
        <img src={logo} alt="Knuckles Retreat" className="auth-brand-mark" />
        <div className="auth-brand-text">
          <span className="auth-brand-name">Knuckles Retreat</span>
          <span className="auth-brand-tag">Reconnect with nature</span>
        </div>
      </div>

      <div className="auth-stage">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          <div className="auth-divider" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
