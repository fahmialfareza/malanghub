import { Fragment } from "react";
import Image from "next/image";
import spinner from "./spinner1.gif";

const Spinner = () => (
  <Fragment>
    <Image
      src={spinner}
      alt=""
      width={200}
      height={200}
      style={{ margin: "auto", display: "block" }}
    />
  </Fragment>
);

export default Spinner;
