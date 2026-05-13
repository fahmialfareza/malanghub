import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";
import type {
  ImageProps,
  LinkProps,
  MetaProps,
  PlatformAdapters,
} from "@malanghub/ui";

const NextLink = ({ href, children, ...props }: LinkProps) => (
  <Link href={href} {...props}>
    {children}
  </Link>
);

const NextImage = ({
  fill,
  objectFit,
  className,
  width,
  height,
  ...props
}: ImageProps) => (
  <Image
    {...props}
    className={className}
    width={fill ? undefined : width}
    height={fill ? undefined : height}
    fill={fill}
    style={{ objectFit }}
  />
);

const NextMeta = ({
  title,
  description,
  canonical,
  robots,
  image,
}: MetaProps) => (
  <Head>
    {title && <title>{title}</title>}
    {description && <meta name="description" content={description} />}
    {canonical && <link rel="canonical" href={canonical} />}
    {robots && <meta name="robots" content={robots} />}
    {image && <meta property="og:image" content={image} />}
  </Head>
);

export const useNextUiAdapters = (): PlatformAdapters => {
  const router = useRouter();

  return {
    Link: NextLink,
    Image: NextImage,
    Meta: NextMeta,
    navigate: (href) => {
      void router.push(href);
    },
    useCurrentPath: () => router.asPath.split("?")[0] || "/",
    reportError: (error) => Sentry.captureException(error),
    googleAuthAvailable: true,
    tinyApiKey: process.env.NEXT_PUBLIC_TINY_API_KEY,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_ADDRESS,
    appName: "Malanghub",
  };
};
