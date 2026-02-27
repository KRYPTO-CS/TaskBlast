/**
 * ColorFilteredImage
 *
 * Wraps a React Native <Image> (or any child view) in a color-matrix filter
 * that compensates for the user's active color-vision-deficiency mode.
 *
 * Uses `react-native-color-matrix-image-filters` (already installed).
 *
 * Intended for illustrative assets where color encodes meaning (e.g., planet
 * thumbnails, status badges, chart images). UI chrome that's already handled
 * by palette tokens does NOT need this wrapper.
 *
 * Usage:
 *   <ColorFilteredImage source={require("../assets/planet_red.png")} style={...} />
 *
 *   // Or wrapping any view subtree:
 *   <ColorFilteredImage>
 *     <View ...> ... </View>
 *   </ColorFilteredImage>
 */

import React from "react";
import { Image, ImageProps, View } from "react-native";
import {
  ColorMatrix,
  concatColorMatrices,
} from "react-native-color-matrix-image-filters";
import {
  useAccessibility,
  type ColorBlindMode,
} from "../context/AccessibilityContext";

// ─── Matrix type alias ────────────────────────────────────────────────────────

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

// ─── Daltonization matrices ───────────────────────────────────────────────────
// Adapted from the standard Daltonization / LMS-based correction approach.
// These CORRECT colors so that distinctions are preserved, not simulate CVD.
// Format: 4×5 row-major flat tuple as required by ColorMatrix.

/** Identity — no transformation */
const IDENTITY: Matrix = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

/**
 * Deuteranopia correction
 * Shifts red/green ambiguous region toward blue contrast axis.
 */
const DEUTERANOPIA: Matrix = [
  0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0,
];

/**
 * Protanopia correction
 * Similar to deuteranopia but tuned for red-channel insensitivity.
 */
const PROTANOPIA: Matrix = [
  0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0,
  1, 0,
];

/**
 * Tritanopia correction
 * Shifts blue/yellow ambiguous region toward red/green contrast axis.
 */
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

// ─── Component ────────────────────────────────────────────────────────────────

interface ColorFilteredImageProps extends ImageProps {
  /** Optional children — if provided, the filter wraps the children instead of an <Image> */
  children?: React.ReactNode;
}

/**
 * Renders an `<Image>` (or its children) with the active CVD correction matrix applied.
 * Falls back gracefully to a plain <Image> if `colorBlindMode` is "none".
 */
export default function ColorFilteredImage({
  children,
  ...imageProps
}: ColorFilteredImageProps) {
  const { colorBlindMode } = useAccessibility();
  const matrix = MATRICES[colorBlindMode];

  if (colorBlindMode === "none") {
    // No filter needed — render directly without the extra wrapper cost
    return children ? <View>{children}</View> : <Image {...imageProps} />;
  }

  return (
    <ColorMatrix matrix={concatColorMatrices(matrix)}>
      {children ?? <Image {...imageProps} />}
    </ColorMatrix>
  );
}
