import DashboardLayout from "../../../components/users/DashboardLayout";
import News from "../../../components/users/news/News";

const UserNewsDraftsPage = () => (
  <DashboardLayout
    section="Antrian Berita"
    description="Berita Anda yang menunggu persetujuan admin."
  >
    <News view="drafts" />
  </DashboardLayout>
);

export default UserNewsDraftsPage;
