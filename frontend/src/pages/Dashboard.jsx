import { useAuth } from "../contexts/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import PatientDashboard    from "./dashboards/PatientDashboard.jsx";
import DoctorDashboard     from "./dashboards/DoctorDashboard.jsx";
import ResponderDashboard  from "./dashboards/ResponderDashboard.jsx";
import AdminDashboard      from "./dashboards/AdminDashboard.jsx";
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard.jsx";

const DASHBOARD_BY_ROLE = {
  PATIENT:    PatientDashboard,
  DOCTOR:     DoctorDashboard,
  RESPONDER:  ResponderDashboard,
  ADMIN:      AdminDashboard,
  SUPERADMIN: SuperAdminDashboard,
};

export default function Dashboard() {
  const { user } = useAuth();
  const RoleDashboard = DASHBOARD_BY_ROLE[user?.role] || PatientDashboard;

  return (
    <Layout breadcrumb={["Dashboard"]}>
      <RoleDashboard />
    </Layout>
  );
}