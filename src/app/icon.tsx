import { ImageResponse } from "next/og";
import { renderAppIcon } from "@/lib/appIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(renderAppIcon(512), size);
}
