import React from "react";
import { Image, ImageProps, View } from "react-native";

interface ColorFilteredImageProps extends ImageProps {
  children?: React.ReactNode;
}

/**
 * Web-safe/default implementation.
 * Native platforms load ColorFilteredImage.native.tsx automatically.
 */
export default function ColorFilteredImage({
  children,
  ...imageProps
}: ColorFilteredImageProps) {
  return children ? <View>{children}</View> : <Image {...imageProps} />;
}
