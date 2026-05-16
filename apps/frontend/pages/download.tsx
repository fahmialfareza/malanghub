import { useEffect } from "react";
import { connect } from "react-redux";
import { DownloadPage } from "@malanghub/ui";
import { setActiveLink } from "../redux/actions/layoutActions";
import { downloadLinks } from "../utils/downloadLinks";

interface DownloadProps {
  setActiveLink: (link: string) => void;
}

function Download({ setActiveLink }: DownloadProps) {
  useEffect(() => {
    setActiveLink("download");
  }, [setActiveLink]);

  return <DownloadPage links={downloadLinks} />;
}

export default connect(null, { setActiveLink })(Download);
