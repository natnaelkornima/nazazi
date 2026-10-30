import * as React from "react";
import { cn } from "@/lib/utils";
import { GoogleIcon } from "./google-icon";

/**
 * NotchedProjectCard
 *
 * A project card whose cover has a rounded notch bitten out of its
 * bottom-right corner, with an action disc nested inside it. The cut is
 * concentric with the action disc, and filleted where it meets the cover's
 * edges, so the cover curves into it instead of ending on a point.
 *
 * The notch is drawn by three layers painted in the colour of the surface
 * BEHIND the card (`surface`, the page background by default).
 */

export interface NotchedProjectCardProps {
  href?: string;
  onClick?: () => void;
  title: string;
  description?: string;
  /** cover photograph */
  image: string;
  imageAlt?: string;
  /** a pill at the top of the cover, e.g. the year or pillar index */
  badge?: string;
  tags?: string[];
  /** Google icon name (e.g. 'how_to_reg', 'verified_user') or custom icon element */
  icon?: string | React.ReactNode;
  /** a product screen over the photo (transparent PNG/WebP works best) */
  screen?: { src: string; alt: string; className?: string };
  /** a dark wash between the photo and the screen, 0 to 1 */
  dim?: number;
  monochrome?: boolean;
  /** the colour behind the card; the notch is painted in it */
  surface?: string;
  /** the disc's fill on hover (any CSS colour); defaults to Nazazi burgundy */
  accent?: string;
  /** the icon's colour on that fill; pick one that contrasts with `accent` */
  accentForeground?: string;
  /** aspect ratio class for the cover photo container (defaults to 'aspect-[4/3]') */
  aspectRatio?: string;
  className?: string;
}

const DISC = 56; // the action disc, px
const BLOCK = 72; // the notch block, px (radius = BLOCK - DISC / 2)
const FILLET = 24; // the curve where the cut meets the cover's edges, px

export function NotchedProjectCard({
  href,
  onClick,
  title,
  description,
  image,
  imageAlt = "",
  badge,
  tags = [],
  icon,
  screen,
  dim = screen ? 0.4 : 0,
  monochrome = false,
  surface = "var(--bg-primary, #FAF8F5)",
  accent = "#981C00",
  accentForeground = "#FFFFFF",
  aspectRatio = "aspect-[4/3]",
  className,
}: NotchedProjectCardProps) {
  const tone = monochrome
    ? "grayscale contrast-[0.95] transition-[filter,scale] duration-500 group-hover:grayscale-0 group-focus-visible:grayscale-0"
    : "transition-[scale] duration-500";

  const Comp = href ? "a" : "div";
  const compProps = href ? { href } : { onClick, role: onClick ? "button" : undefined };

  return (
    <Comp
      {...(compProps as any)}
      className={cn(
        "group flex flex-col rounded-[26px] outline-none transition-all duration-200",
        href || onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-[#981C00] focus-visible:ring-offset-2" : "",
        className
      )}
    >
      <div className="relative">
        {/* The Cover Photo */}
        <div className={cn("relative overflow-hidden rounded-[26px] bg-[#F7F4F0] dark:bg-[#1E1B18] border border-[#E5E0D8] dark:border-[#2C2723]", aspectRatio)}>
          <img
            src={image}
            alt={screen ? "" : imageAlt}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              tone,
              !screen && "group-hover:scale-[1.04]"
            )}
          />
          {dim > 0 && (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"
              style={{ backgroundColor: `rgb(0 0 0 / ${dim})` }}
            />
          )}
          {screen && (
            <img
              src={screen.src}
              alt={screen.alt}
              className={cn(
                "absolute bottom-0 right-0 w-[82%] origin-bottom-right drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)] group-hover:scale-[1.07]",
                tone,
                screen.className
              )}
            />
          )}
          {badge && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between items-center px-4 pt-3.5">
              <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10.5px] font-mono font-medium text-white/90 backdrop-blur-md">
                {badge}
              </span>
            </div>
          )}
        </div>

        {/* The Notch: A block with a concave corner, painted in `surface` color */}
        <div
          aria-hidden
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{
            width: BLOCK,
            height: BLOCK,
            borderTopLeftRadius: BLOCK - DISC / 2,
            background: surface,
          }}
        />

        {/* Fillet curves where cut meets cover edges */}
        {[
          { bottom: BLOCK, right: 0 },
          { bottom: 0, right: BLOCK },
        ].map((pos, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              ...pos,
              width: FILLET,
              height: FILLET,
              background: `radial-gradient(circle at top left, transparent ${FILLET - 0.5}px, ${surface} ${FILLET}px)`,
            }}
          />
        ))}

        {/* The Action Disc nested directly inside the notch */}
        <span
          aria-hidden
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#E5E0D8] dark:border-[#2E2824] text-[#8F2B14] dark:text-[#E89382] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[#981C00] group-hover:text-white group-hover:border-[#981C00]"
          style={
            {
              width: DISC,
              height: DISC,
              "--card-accent": accent,
              "--card-accent-fg": accentForeground,
            } as React.CSSProperties
          }
        >
          {icon ? (
            <div className="size-6 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
              {typeof icon === "string" ? <GoogleIcon name={icon} size={22} /> : icon}
            </div>
          ) : (
            <GoogleIcon
              name="north_east"
              size={22}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          )}
        </span>
      </div>

      {/* Card Content */}
      <div className="pt-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-[#706A65] dark:text-[#A8A19A]">
              {description}
            </p>
          )}
        </div>

        {tags.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <li
                key={`${t}-${i}`}
                className="rounded-md bg-[#FAF0ED] dark:bg-[#2A1D1A] border border-[#F3D5CD] dark:border-[#3E2520] px-2 py-0.5 text-[10.5px] font-medium text-[#8F2B14] dark:text-[#E89382]"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Comp>
  );
}

export default NotchedProjectCard;
