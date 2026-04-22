import React from "react";
import { Image, ImageProps, View } from "react-native";
import {
  ColorMatrix,
  concatColorMatrices,
} from "react-native-color-matrix-image-filters";
import {
  useAccessibility,
  type ColorBlindMode,
} from "../app/context/AccessibilityContext";

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const IDENTITY: Matrix = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

const DEUTERANOPIA: Matrix = [
  0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0,
];

const PROTANOPIA: Matrix = [
  0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0,
  1, 0,
];

const TRITANOPIA: Matrix = [
  0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1,
  0,
];

const MATRICES: Record<ColorBlindMode, Matrix> = {
  none: IDENTITY,
  deuteranopia: DEUTERANOPIA,
  protanopia: PROTANOPIA,
  tritanopia: TRITANOPIA,
};

interface ColorFilteredImageProps extends ImageProps {
  children?: React.ReactNode;
}

export default function ColorFilteredImage({
  children,
  ...imageProps
}: ColorFilteredImageProps) {
  const { colorBlindMode } = useAccessibility();
  const matrix = MATRICES[colorBlindMode];

  if (colorBlindMode === "none") {
    return children ? <View>{children}</View> : <Image {...imageProps} />;
  }

  return (
    <ColorMatrix matrix={concatColorMatrices(matrix)}>
      {children ?? <Image {...imageProps} />}
    </ColorMatrix>
  );
}
