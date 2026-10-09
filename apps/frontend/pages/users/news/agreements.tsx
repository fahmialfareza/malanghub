import DashboardLayout from "../../../components/users/DashboardLayout";
import News from "../../../components/users/news/News";

const UserNewsAgreementsPage = () => (
  <DashboardLayout
    section="Persetujuan Berita"
    description="Tinjau dan setujui antrian berita dari semua penulis."
    adminOnly
  >
    <News view="agreements" />
  </DashboardLayout>
);

export default UserNewsAgreementsPage;
