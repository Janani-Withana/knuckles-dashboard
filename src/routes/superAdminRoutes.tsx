import { Route } from "react-router-dom";

import SuperDashboardScreen from "../screens/superAdmin/Dashboard/SuperDashboardScreen";
import PropertiesListScreen from "../screens/superAdmin/Properties/PropertiesListScreen";
import PropertyDetailScreen from "../screens/superAdmin/Properties/PropertyDetailScreen";
import PropertyAdminsListScreen from "../screens/superAdmin/PropertyAdmins/PropertyAdminsListScreen";
import CreatePropertyAdminScreen from "../screens/superAdmin/PropertyAdmins/CreatePropertyAdminScreen";
import BillingScreen from "../screens/superAdmin/Billing/BillingScreen";
import SuperSettingsScreen from "../screens/superAdmin/Settings/SuperSettingsScreen";
import OrganizationsListScreen from "../screens/superAdmin/Organizations/OrganizationsListScreen";
import CreateOrganizationScreen from "../screens/superAdmin/Organizations/CreateOrganizationScreen";
import OrganizationDetailScreen from "../screens/superAdmin/Organizations/OrganizationDetailScreen";
import CreatePropertyScreen from "../screens/superAdmin/Properties/CreatePropertyScreen";

import { ROUTES } from "./paths";

export const superAdminRoutes = (
  <>
    <Route path={ROUTES.SUPER_DASHBOARD} element={<SuperDashboardScreen />} />
    <Route path={ROUTES.SUPER_PROPERTIES} element={<PropertiesListScreen />} />
    <Route
      path={ROUTES.SUPER_PROPERTY_DETAIL}
      element={<PropertyDetailScreen />}
    />
    <Route
      path={ROUTES.SUPER_PROPERTY_ADMINS}
      element={<PropertyAdminsListScreen />}
    />
    <Route
      path={ROUTES.SUPER_CREATE_PROPERTY_ADMIN}
      element={<CreatePropertyAdminScreen />}
    />
    <Route
      path={ROUTES.SUPER_ORGANIZATIONS}
      element={<OrganizationsListScreen />}
    />
    <Route
      path={ROUTES.SUPER_ORGANIZATION_NEW}
      element={<CreateOrganizationScreen />}
    />
    <Route
      path={ROUTES.SUPER_ORGANIZATION_DETAIL}
      element={<OrganizationDetailScreen />}
    />
    <Route
      path={ROUTES.SUPER_PROPERTY_NEW}
      element={<CreatePropertyScreen />}
    />
    <Route path={ROUTES.SUPER_BILLING} element={<BillingScreen />} />
    <Route path={ROUTES.SUPER_SETTINGS} element={<SuperSettingsScreen />} />
  </>
);
