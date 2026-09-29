import { Route } from "react-router-dom";

import SuperDashboardScreen from "@/features/platform/pages/SuperDashboardScreen";
import BillingScreen from "@/features/platform/pages/BillingScreen";
import SuperSettingsScreen from "@/features/platform/pages/SuperSettingsScreen";
import OrganizationsListScreen from "@/features/organizations/pages/OrganizationsListScreen";
import CreateOrganizationScreen from "@/features/organizations/pages/CreateOrganizationScreen";
import OrganizationDetailScreen from "@/features/organizations/pages/OrganizationDetailScreen";
import PropertiesListScreen from "@/features/properties/pages/PropertiesListScreen";
import PropertyDetailScreen from "@/features/properties/pages/PropertyDetailScreen";
import CreatePropertyScreen from "@/features/properties/pages/CreatePropertyScreen";
import PropertyAdminsListScreen from "@/features/staff/pages/PropertyAdminsListScreen";
import CreatePropertyAdminScreen from "@/features/staff/pages/CreatePropertyAdminScreen";

export const platformRoutes = (
  <>
    <Route index element={<SuperDashboardScreen />} />
    <Route path="organizations" element={<OrganizationsListScreen />} />
    <Route path="organizations/new" element={<CreateOrganizationScreen />} />
    <Route
      path="organizations/:organizationUid"
      element={<OrganizationDetailScreen />}
    />
    <Route
      path="organizations/:organizationUid/properties/new"
      element={<CreatePropertyScreen />}
    />
    <Route
      path="organizations/:organizationUid/properties/:propertyUid"
      element={<PropertyDetailScreen />}
    />
    <Route path="properties" element={<PropertiesListScreen />} />
    <Route path="properties/:propertyUid" element={<PropertyDetailScreen />} />
    <Route path="admins" element={<PropertyAdminsListScreen />} />
    <Route path="admins/invite" element={<CreatePropertyAdminScreen />} />
    <Route path="billing" element={<BillingScreen />} />
    <Route path="settings" element={<SuperSettingsScreen />} />
  </>
);
