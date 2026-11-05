/** A sprite's pixels: one crisp <path> per colour (see pixelArt.js). */
export function PixelPaths({ sprite }) {
  return sprite.paths.map(({ fill, d }) => <path key={fill} d={d} fill={fill} />);
}

/**
 * Crisp inline-SVG pixel art (shape-rendering: crispEdges) for a sprite built
 * with defineSprite() at module load.
 * - pixelSize: CSS px per art pixel; sets the width/height attributes. Omit it
 *   to size the SVG with CSS alone (its height then follows the viewBox).
 * - label: exposes the art as role="img" with that name; otherwise it is
 *   decorative and hidden from assistive tech.
 * - children: extra SVG layers drawn on the same grid (e.g. a blink frame).
 */
const PixelSprite = ({ sprite, pixelSize, className, label, children }) => {
  const labelled = typeof label === "string" && label.length > 0;
  const sized = Number.isFinite(pixelSize) && pixelSize > 0;

  return (
    <svg
      className={className || undefined}
      viewBox={`0 0 ${sprite.width} ${sprite.height}`}
      width={sized ? sprite.width * pixelSize : undefined}
      height={sized ? sprite.height * pixelSize : undefined}
      shapeRendering="crispEdges"
      focusable="false"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <PixelPaths sprite={sprite} />
      {children}
    </svg>
  );
};

export default PixelSprite;
