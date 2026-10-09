import DashboardLayout from "../../components/users/DashboardLayout";
import Tags from "../../components/users/news/tags/Tags";

const UserTagsPage = () => (
  <DashboardLayout section="Tag" description="Kelola tag berita." adminOnly>
    <Tags />
  </DashboardLayout>
);

export default UserTagsPage;
