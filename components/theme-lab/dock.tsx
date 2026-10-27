"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { focusKeyProps, useCarriedFocus } from "@/lib/client/lazy";
import { useThemeLab } from "@/lib/client/theme-lab";
import {
  AccentControl,
  DensityControl,
  FontControl,
  labControls,
  NeutralControl,
  RadiusControl,
  ResetButton,
} from "./controls";
import type { DockView } from "./logic";
import { setDockView, useDockView } from "./store";
import {
  BarLabel,
  barClasses,
  collapseClasses,
  CollapseIcon,
  Divider,
  LAB_KEYS,
  pillClasses,
  ThemePillContent,
} from "./views";

/**
 * The interactive dock, loaded by ThemeLabActivator in place of the static one. The bar's Radix-based controls
 * (accent popover, radius slider, font menu) and the phone sheet arrive on the first pointerenter or focus inside it
 * (see ./controls).
 */
export function ThemeLabDockClient() {
  useCarriedFocus();
  return (
    <>
      <div className="hidden sm:contents">
        <DockBar />
      </div>
      <div className="contents sm:hidden">
        <PhoneSheet />
      </div>
    </>
  );
}

function Pill() {
  const theme = useThemeLab();
  return <ThemePillContent accent={theme.accent} />;
}

function DockBar() {
  const view = useDockView();
  // Only a user's toggle animates; the dock appears without motion on page load.
  const [toggled, setToggled] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!toggled) return;
    (view === "collapsed" ? pillRef : collapseRef).current?.focus();
  }, [toggled, view]);

  function toggle(next: DockView) {
    setToggled(true);
    setDockView(next);
  }

  if (view === null) return null;

  if (view === "collapsed") {
    return (
      <button
        ref={pillRef}
        type="button"
        aria-expanded={false}
        aria-label="Theme Lab"
        onClick={() => toggle("expanded")}
        className={clsx(pillClasses, toggled && "origin-bottom animate-pop-in")}
        {...focusKeyProps(LAB_KEYS.pill)}
      >
        <Pill />
      </button>
    );
  }

  return (
    <section
      aria-label="Theme Lab"
      onPointerEnter={labControls.preload}
      onFocus={labControls.preload}
      className={clsx(barClasses, toggled && "origin-bottom animate-pop-in")}
    >
      <BarLabel />
      <AccentControl />
      <Divider />
      <NeutralControl layout="bar" />
      <Divider />
      <RadiusControl />
      <Divider />
      <FontControl />
      <Divider />
      <DensityControl layout="bar" />
      <Divider />
      <ResetButton layout="bar" />
      <button
        ref={collapseRef}
        type="button"
        aria-expanded
        aria-label="Collapse Theme Lab"
        onClick={() => toggle("collapsed")}
        className={collapseClasses}
        {...focusKeyProps(LAB_KEYS.collapse)}
      >
        <CollapseIcon />
      </button>
    </section>
  );
}

function PhoneSheet() {
  const Lab = labControls.use();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={labControls.preload}
        onFocus={labControls.preload}
        onClick={() => {
          labControls.preload();
          setOpen(true);
        }}
        className={pillClasses}
        {...focusKeyProps(LAB_KEYS.phone)}
      >
        <Pill />
      </button>
      {Lab ? <Lab.PhoneSheet open={open} onOpenChange={setOpen} triggerRef={triggerRef} /> : null}
    </>
  );
}
