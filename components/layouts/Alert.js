import { useEffect } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Alert = ({ layout: { alert } }) => {
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
      <ToastContainer />
    </>
  );
};

const mapStateToProps = (state) => ({
  layout: state.layout,
});

export default connect(mapStateToProps, {})(Alert);
