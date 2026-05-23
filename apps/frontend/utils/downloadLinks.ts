import type { DownloadLink } from "@malanghub/ui";

const optionalUrl = (value?: string) => value?.trim() || undefined;

export const downloadLinks: DownloadLink[] = [
  {
    platform: "iOS",
    group: "mobile",
    icon: "fa-apple",
    description: "Untuk iPhone dan iPad.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_IOS_URL) ??
      "https://apps.apple.com/id/app/malanghub/id6769426628",
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
      "https://apps.apple.com/id/app/malanghub/id6769426628",
  },
  {
    platform: "Windows",
    group: "desktop",
    icon: "fa-windows",
    description: "Installer desktop untuk Windows.",
    href:
      optionalUrl(process.env.NEXT_PUBLIC_DOWNLOAD_WINDOWS_URL) ??
      "https://apps.microsoft.com/detail/9N1W77XV5TPQ",
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
