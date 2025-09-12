import { connect } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../redux/store"; // Assuming you have RootState from your redux store
import { FC } from "react";

interface PrivateRouteProps {
  component: FC<any>; // Use `FC` for functional components
  user: {
    isAuthenticated: boolean;
    user: any; // You can replace `any` with a more specific user type if available
  };
}

const PrivateRoute: FC<PrivateRouteProps> = ({
  component: Component,
  user: { isAuthenticated, user },
}) => {
  const router = useRouter();

  // If the user is not authenticated, redirect to sign in page
  if (!isAuthenticated && !user) {
    if (!router.isReady) return null;

    router.push("/signin");
    return null; // Don't return anything while redirecting
  }

  // If the user is authenticated, render the component
  return <Component />;
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps)(PrivateRoute);
