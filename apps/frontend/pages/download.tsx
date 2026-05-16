import { useEffect } from "react";
import { connect } from "react-redux";
import { DownloadPage, type DownloadLink } from "@malanghub/ui";
import { setActiveLink } from "../redux/actions/layoutActions";

interface DownloadProps {
  setActiveLink: (link: string) => void;
}

const optionalUrl = (value?: string) => value?.trim() || undefined;

const downloadLinks: DownloadLink[] = [
  {
    platform: "iOS",
    group: "mobile",
    icon: "fa-apple",
    description: "Untuk iPhone dan iPad.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_IOS_URL) ??
      "https://apps.apple.com/us/app/malanghub/id6769426628",
  },
  {
    platform: "Android",
    group: "mobile",
    icon: "fa-android",
    description: "Untuk perangkat Android dan tablet Android.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_URL) ??
      "https://play.google.com/store/apps/details?id=com.malanghub.native",
  },
  {
    platform: "macOS",
    group: "desktop",
    icon: "fa-apple",
    description: "Installer desktop untuk Mac.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_MACOS_URL) ??
      "https://apps.apple.com/us/app/malanghub/id6769426628",
  },
  {
    platform: "Windows",
    group: "desktop",
    icon: "fa-windows",
    description: "Installer desktop untuk Windows.",
    href: optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_WINDOWS_URL),
  },
  {
    platform: "Linux",
    group: "desktop",
    icon: "fa-linux",
    description: "Paket aplikasi untuk Linux.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_LINUX_URL) ??
      "https://snapcraft.io/malanghub",
  },
];

function Download({ setActiveLink }: DownloadProps) {
  useEffect(() => {
    setActiveLink("download");
  }, [setActiveLink]);

  return <DownloadPage links={downloadLinks} />;
}

export default connect(null, { setActiveLink })(Download);
