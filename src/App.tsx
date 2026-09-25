import React, { useEffect, useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import MobileHeader from "./components/layout/MobileHeader";
import DashboardScreen from "./screens/Dashboard/DashboardScreen";
import SignInScreen from "./screens/Auth/SignInScreen";
import SignUpScreen from "./screens/Auth/SignUpScreen";

import "./App.css";

type AuthView = "signin" | "signup" | "dashboard";

function App(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  const [authView, setAuthView] = useState<AuthView>("signin");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    const onResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  if (authView === "signin") {
    return (
      <SignInScreen
        onSignIn={() => setAuthView("dashboard")}
        onSwitchToSignUp={() => setAuthView("signup")}
      />
    );
  }

  const handleSignOut = () => {
    setAuthView("signin");
  };

  if (authView === "signup") {
    return (
      <SignUpScreen
        onSignUp={() => setAuthView("dashboard")}
        onSwitchToSignIn={() => setAuthView("signin")}
      />
    );
  }

  return (
    <div className={`app${menuOpen ? " menu-open" : ""}`}>
      {/* Mobile Header */}

      <MobileHeader onMenuOpen={() => setMenuOpen(true)} />

      {/* Mobile backdrop */}

      <button
        type="button"
        className={`sidebar-backdrop${menuOpen ? " visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close menu"
      />

      {/* Sidebar */}

      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={handleSignOut}
      />
      {/* Main */}

      <main className="main">
        <div className="content">
          <DashboardScreen />
        </div>
      </main>
    </div>
  );
}

export default App;
