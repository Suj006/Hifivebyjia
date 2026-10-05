import Image, { type ImageProps } from "next/image";
import type { ProductImage as ProductImageType } from "@/types";

interface Props extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  image: ProductImageType;
  alt?: string;
}

/**
 * Product image wrapper. Uses Next.js image optimisation for photos and
 * serves SVG illustrations directly (they are already tiny and crisp).
 * Images use object-contain so products are never cropped.
 */
export function ProductImage({ image, alt, className, ...rest }: Props) {
  const isSvg = image.src.endsWith(".svg");
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      width={image.width}
      height={image.height}
      unoptimized={isSvg}
      className={className ?? "h-full w-full object-contain"}
      {...rest}
    />
  );
}
