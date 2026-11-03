import * as React from "react";
import { cn } from "@/lib/utils";
import { GoogleIcon } from "./google-icon";

export interface NotchedProjectCardProps {
  href?: string;
  onClick?: () => void;
  title: string;
  description?: string;
  /** cover photograph */
  image: string;
  imageAlt?: string;
  /** a pill at the top of the cover, e.g. the pillar index (01, 02...) */
  badge?: string;
  tags?: string[];
  /** Google icon name (e.g. 'how_to_reg', 'verified_user') or custom icon element */
  icon?: string | React.ReactNode;
  /** a product screen over the photo (optional) */
  screen?: { src: string; alt: string; className?: string };
  /** a dark wash between the photo and the screen, 0 to 1 */
  dim?: number;
  monochrome?: boolean;
  /** surface color behind card (kept for backwards compatibility) */
  surface?: string;
  /** the accent colour for hover states; defaults to Nazazi red */
  accent?: string;
  /** the accent foreground color */
  accentForeground?: string;
  /** aspect ratio class for the cover photo container (defaults to 'aspect-[16/10]') */
  aspectRatio?: string;
  className?: string;
}

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
  accent = "#981C00",
  aspectRatio = "aspect-[16/10]",
  className,
}: NotchedProjectCardProps) {
  const tone = monochrome
    ? "grayscale contrast-[0.95] transition-all duration-500 group-hover:grayscale-0"
    : "transition-transform duration-500 ease-out";

  const Comp = href ? "a" : "div";
  const compProps = href
    ? { href, target: href.startsWith("http") ? "_blank" : undefined, rel: href.startsWith("http") ? "noopener noreferrer" : undefined }
    : { onClick, role: onClick ? "button" : undefined, tabIndex: onClick ? 0 : undefined };

  return (
    <Comp
      {...(compProps as any)}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-800",
        "bg-white/95 dark:bg-neutral-900/90 backdrop-blur-sm",
        "shadow-sm hover:shadow-xl hover:border-neutral-300 dark:hover:border-neutral-700",
        "transition-all duration-300 outline-none overflow-hidden",
        (href || onClick) && "cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#981C00] focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Top Image Preview Container */}
      <div className="p-2.5 sm:p-3 pb-0">
        <div className={cn("relative w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-800", aspectRatio)}>
          <img
            src={image}
            alt={screen ? "" : imageAlt}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover group-hover:scale-105",
              tone
            )}
          />

          {/* Optional dim overlay */}
          {dim > 0 && (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"
              style={{ backgroundColor: `rgb(0 0 0 / ${dim})` }}
            />
          )}

          {/* Optional overlaid product screen */}
          {screen && (
            <img
              src={screen.src}
              alt={screen.alt}
              className={cn(
                "absolute bottom-0 right-0 w-[82%] origin-bottom-right drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)] group-hover:scale-[1.06] transition-transform duration-500",
                tone,
                screen.className
              )}
            />
          )}

          {/* Subtle top gradient shadow for badge readability */}
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          {/* Number / Pillar Badge */}
          {badge && (
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider text-white bg-black/60 backdrop-blur-md border border-white/20 shadow-sm">
                {badge}
              </span>
            </div>
          )}

          {/* Floating Action / Feature Disc */}
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span
              aria-hidden
              className="flex items-center justify-center size-9 sm:size-10 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-700/80 text-[#981C00] dark:text-[#E89382] shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#981C00] group-hover:text-white group-hover:border-[#981C00]"
            >
              {icon ? (
                <div className="size-5 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                  {typeof icon === "string" ? <GoogleIcon name={icon} size={20} /> : icon}
                </div>
              ) : (
                <GoogleIcon
                  name="north_east"
                  size={20}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="p-4 sm:p-5 pt-3.5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#981C00] dark:group-hover:text-[#E89382] transition-colors line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-3">
              {description}
            </p>
          )}
        </div>

        {/* Minimal Tags */}
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            {tags.map((t, i) => (
              <li
                key={`${t}-${i}`}
                className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
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
