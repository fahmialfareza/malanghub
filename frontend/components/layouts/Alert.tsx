import { useEffect } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  layout: {
    alert: {
      message: string;
      type: string;
    };
  };
};

const Alert: React.FC<Props> = ({ layout: { alert } }) => {
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

const mapStateToProps = (state: {
  layout: {
    alert: {
      message: string;
      type: string;
    };
  };
}) => ({
  layout: state.layout,
});

export default connect(mapStateToProps, {})(Alert);
