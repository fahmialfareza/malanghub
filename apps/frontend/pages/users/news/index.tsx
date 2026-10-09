import DashboardLayout from "../../../components/users/DashboardLayout";
import News from "../../../components/users/news/News";

const UserNewsPage = () => (
  <DashboardLayout
    section="Berita"
    description="Berita Anda yang sudah terbit."
  >
    <News view="news" />
  </DashboardLayout>
);

export default UserNewsPage;
