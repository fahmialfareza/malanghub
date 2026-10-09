import DashboardLayout from "../../components/users/DashboardLayout";
import DashboardOverview from "../../components/users/DashboardOverview";

const UserDashboard = () => (
  <DashboardLayout description="Kelola profil, berita, dan data Malanghub Anda.">
    <DashboardOverview />
  </DashboardLayout>
);

export default UserDashboard;
