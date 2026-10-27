import { DEFAULT_THEME, DENSITIES, FONTS, NEUTRALS } from "@/lib/theme";
import {
  accentTriggerClasses,
  AccentTriggerContent,
  BarLabel,
  barClasses,
  collapseClasses,
  CollapseIcon,
  DENSITY_ORDER,
  DensityItemContent,
  Divider,
  fontTriggerClasses,
  FontTriggerContent,
  LAB_KEYS,
  NEUTRAL_IDS,
  NeutralItemContent,
  pillClasses,
  RadiusFrame,
  RadiusTrack,
  resetClasses,
  ResetContent,
  segmentAttributes,
  segmentItem,
  segmentTrack,
  ThemePillContent,
} from "./views";

/**
 * Theme Lab as the server renders it: the default theme in the view a first visit gets (phones a Theme button,
 * tablets the collapsed pill, 1024px and up the open bar), drawn with the same views as the interactive dock and no
 * JavaScript. ThemeLabActivator swaps in the real dock on the first pointerenter, focus or click, carrying focus and
 * the click across, or straight away for a visitor with a stored theme or dock state.
 */
export function StaticDock() {
  const theme = DEFAULT_THEME;
  return (
    <>
      <div className="hidden sm:contents">
        <button
          type="button"
          aria-expanded={false}
          aria-label="Theme Lab"
          data-focus-key={LAB_KEYS.pill}
          className={`${pillClasses} lg:hidden`}
        >
          <ThemePillContent accent={theme.accent} />
        </button>
        <section aria-label="Theme Lab" className={`${barClasses} max-lg:hidden`}>
          <BarLabel />
          <button
            type="button"
            aria-label={`Accent ${theme.accent}`}
            aria-haspopup="dialog"
            aria-expanded={false}
            data-focus-key={LAB_KEYS.accent}
            className={accentTriggerClasses}
          >
            <AccentTriggerContent accent={theme.accent} />
          </button>
          <Divider />
          <div role="radiogroup" aria-label="Neutral" className={segmentTrack}>
            {NEUTRAL_IDS.map((id) => (
              <button
                key={id}
                {...segmentAttributes(id === theme.neutral)}
                aria-label={NEUTRALS[id].name}
                data-focus-key={LAB_KEYS.neutral(id)}
                className={segmentItem}
              >
                <NeutralItemContent id={id} layout="bar" />
              </button>
            ))}
          </div>
          <Divider />
          <RadiusFrame layout="bar" value={theme.radius}>
            <RadiusTrack value={theme.radius} />
          </RadiusFrame>
          <Divider />
          <button
            type="button"
            aria-label={`Font ${FONTS[theme.font].name}`}
            aria-haspopup="menu"
            aria-expanded={false}
            data-focus-key={LAB_KEYS.font}
            className={fontTriggerClasses}
          >
            <FontTriggerContent font={theme.font} />
          </button>
          <Divider />
          <div role="radiogroup" aria-label="Density" className={segmentTrack}>
            {DENSITY_ORDER.map((id) => (
              <button
                key={id}
                {...segmentAttributes(id === theme.density)}
                aria-label={DENSITIES[id].name}
                data-focus-key={LAB_KEYS.density(id)}
                className={segmentItem}
              >
                <DensityItemContent id={id} layout="bar" />
              </button>
            ))}
          </div>
          <Divider />
          <button
            type="button"
            aria-disabled
            aria-label="Reset theme"
            data-focus-key={LAB_KEYS.reset}
            className={resetClasses("bar")}
          >
            <ResetContent layout="bar" />
          </button>
          <button
            type="button"
            aria-expanded
            aria-label="Collapse Theme Lab"
            data-focus-key={LAB_KEYS.collapse}
            className={collapseClasses}
          >
            <CollapseIcon />
          </button>
        </section>
      </div>
      <div className="contents sm:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={false}
          data-focus-key={LAB_KEYS.phone}
          className={pillClasses}
        >
          <ThemePillContent accent={theme.accent} />
        </button>
      </div>
    </>
  );
}
