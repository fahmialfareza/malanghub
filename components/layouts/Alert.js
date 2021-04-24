import React, { Fragment } from "react";
import { connect } from "react-redux";

const Alert = ({ layout: { alert } }) => {
  return (
    <Fragment>
      {alert?.message && (
        <div className={`alert alert-${alert?.type}`} role="alert">
          {alert?.message}
        </div>
      )}
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  layout: state.layout,
});

export default connect(mapStateToProps, {})(Alert);
