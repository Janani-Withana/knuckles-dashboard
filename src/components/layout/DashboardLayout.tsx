import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { adminMenuItems } from "@/data/adminMenu";
import { superAdminMenuItems } from "@/data/superAdminMenu";
import { staffMenuItems } from "@/data/staffMenu";
import { ROUTES } from "@/routes/paths";
import { isHotelAdmin, isPlatformAdmin } from "@/types/auth.types";

export default function DashboardLayout(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onResize = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const handleSignOut = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const menuItems = isPlatformAdmin(user)
    ? superAdminMenuItems
    : isHotelAdmin(user)
      ? adminMenuItems
      : staffMenuItems;

  return (
    <div className={`app${menuOpen ? " menu-open" : ""}`}>
      <MobileHeader onMenuOpen={() => setMenuOpen(true)} />
      <button
        type="button"
        className={`sidebar-backdrop${menuOpen ? " visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close menu"
      />
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={handleSignOut}
        menuItems={menuItems}
      />
      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
