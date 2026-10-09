import { useEffect } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type LayoutState = {
  alert: {
    message: string;
    type: string;
  };
  theme: string | null;
};

type Props = {
  layout: LayoutState;
};

const Alert: React.FC<Props> = ({ layout: { alert, theme } }) => {
  useEffect(() => {
    if (alert?.type === "success") {
      toast.success(alert?.message);
    } else if (alert?.type === "danger") {
      toast.error(alert?.message);
    } else {
      toast(alert?.message);
    }
  }, [alert]);

  return (
    <>
      <ToastContainer theme={theme === "dark" ? "dark" : "light"} />
    </>
  );
};

const mapStateToProps = (state: { layout: LayoutState }) => ({
  layout: state.layout,
});

export default connect(mapStateToProps, {})(Alert);
