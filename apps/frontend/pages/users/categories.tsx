import DashboardLayout from "../../components/users/DashboardLayout";
import Categories from "../../components/users/news/categories/Categories";

const UserCategoriesPage = () => (
  <DashboardLayout
    section="Kategori"
    description="Kelola kategori berita."
    adminOnly
  >
    <Categories />
  </DashboardLayout>
);

export default UserCategoriesPage;
