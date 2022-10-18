import { connect } from "react-redux";
import { useRouter } from "next/router";

const PrivateRoute = ({
  component: Component,
  user: { isAuthenticated, user },
}) => {
  const router = useRouter();

  if (!isAuthenticated && !user) {
    if (!router.isReady) return;

    return router.push("/signin");
  } else {
    return <Component {...props} />;
  }
};

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps, {})(PrivateRoute);
