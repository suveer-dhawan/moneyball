import { ImageResponse } from "next/og";
import { renderAppIcon } from "@/lib/appIcon";

// Served at /icon/192 and /icon/512. The mark sits inside the central 80%,
// so the 512 variant is also safe to use as a maskable icon.
const SIZES = [192, 512];

export function generateImageMetadata() {
  return SIZES.map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const px = Number(await id);
  return new ImageResponse(renderAppIcon(px), { width: px, height: px });
}
