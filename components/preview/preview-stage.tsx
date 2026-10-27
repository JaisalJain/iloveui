"use client";

import { Check, ChevronDown, Moon, RotateCcw, Sun } from "lucide-react";
import { DropdownMenu, ToggleGroup } from "radix-ui";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useColorMode, type ColorMode } from "@/lib/client/theme-mode";
import { cn } from "@/lib/utils";
import { FRAME_SOURCE, PARENT_SOURCE, type ParentMessage } from "./protocol";

// The design page's preview stage: one live iframe whose width, light/dark and state the visitor controls.
// Theme Lab reaches the frame through data-preview; light/dark belongs to the stage (it starts from the site's mode
// and follows the site when that changes, but the stage toggle can override it).

export const STAGE_MIN_WIDTH = 320;
export const STAGE_MAX_WIDTH = 1920;
const PRESETS = [375, 768, 1440] as const;
const STEP = 10;
const BIG_STEP = 100;

type StageWidth = number | "full";

const segmented = "inline-flex items-center rounded-control border border-hairline bg-surface p-0.5 shadow-sm";
const segment = cn(
  "inline-flex h-7 min-w-10 items-center justify-center gap-1.5 rounded-[4px] px-2.5 font-mono text-12 text-muted tabular-nums",
  "transition-colors duration-160 ease-site hover:text-fg pointer-coarse:h-9",
  "data-[state=on]:bg-raised data-[state=on]:text-accent",
);
const toolButton = cn(
  "inline-flex h-8 items-center gap-2 rounded-control border border-hairline bg-surface px-3 text-14 text-fg shadow-sm",
  "transition-[background-color,transform] duration-160 ease-site hover:bg-raised active:translate-y-px pointer-coarse:h-10",
);

const clamp = (value: number) => Math.min(STAGE_MAX_WIDTH, Math.max(STAGE_MIN_WIDTH, Math.round(value)));

const STATE_LABELS: Record<string, string> = {
  default: "Default",
  hover: "Hover",
  focus: "Focus",
  active: "Active",
  disabled: "Disabled",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  success: "Success",
};

export function PreviewStage({ slug, name, states }: { slug: string; name: string; states: readonly string[] }) {
  const siteMode = useColorMode();
  // The stage toggle overrides the site's mode until the site's mode itself changes.
  const [override, setOverride] = useState<{ mode: ColorMode; siteMode: ColorMode } | null>(null);
  const mode = override && override.siteMode === siteMode ? override.mode : siteMode;
  const [state, setState] = useState("default");
  const [width, setWidth] = useState<StageWidth>("full");
  const [available, setAvailable] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // Menus render inside the stage section, so they stay within its landmark.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = useRef({ mode, state });
  const drag = useRef<{ x: number; width: number; scale: number } | null>(null);

  const post = useCallback((message: DistributiveOmit<ParentMessage, "source">) => {
    frameRef.current?.contentWindow?.postMessage({ source: PARENT_SOURCE, ...message }, window.location.origin);
  }, []);

  useEffect(() => {
    current.current = { mode, state };
  }, [mode, state]);

  useEffect(() => {
    post({ type: "mode", mode });
  }, [mode, post]);

  useEffect(() => {
    post({ type: "state", state });
  }, [state, post]);

  // A frame that (re)loads announces itself; give it the stage's mode and state (the bridge sends the theme).
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const message = data as { source?: unknown; type?: unknown };
      if (message.source !== FRAME_SOURCE || message.type !== "ready") return;
      post({ type: "mode", mode: current.current.mode });
      post({ type: "state", state: current.current.state });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(Math.floor(entry.contentRect.width));
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const target = width === "full" ? (available ?? STAGE_MAX_WIDTH) : width;
  const scale = available !== null && target > available ? available / target : 1;
  const percent = Math.round(scale * 100);
  const measured = available !== null;

  function onHandlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    drag.current = { x: event.clientX, width: target, scale };
    setDragging(true);
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    // The frame is centered, so its edge moves half as far as its width changes.
    setWidth(clamp(start.width + ((event.clientX - start.x) * 2) / start.scale));
  }

  function onHandlePointerUp() {
    drag.current = null;
    setDragging(false);
  }

  function onHandleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? BIG_STEP / 2 : STEP;
    const next: Record<string, number> = {
      ArrowLeft: target - step,
      ArrowDown: target - step,
      ArrowRight: target + step,
      ArrowUp: target + step,
      PageDown: target - BIG_STEP,
      PageUp: target + BIG_STEP,
      Home: STAGE_MIN_WIDTH,
      End: STAGE_MAX_WIDTH,
    };
    const value = next[event.key];
    if (value === undefined) return;
    event.preventDefault();
    setWidth(clamp(value));
  }

  const preset = width === "full" ? "full" : PRESETS.includes(width as (typeof PRESETS)[number]) ? String(width) : "";
  const showStates = states.length > 1;

  return (
    <section ref={setPortalTarget} aria-label="Live preview" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup.Root
          type="single"
          value={preset}
          onValueChange={(value) => {
            if (value) setWidth(value === "full" ? "full" : Number(value));
          }}
          aria-label="Viewport width"
          className={segmented}
        >
          {PRESETS.map((value) => (
            <ToggleGroup.Item key={value} value={String(value)} aria-label={`${value} pixels`} className={segment}>
              {value}
            </ToggleGroup.Item>
          ))}
          <ToggleGroup.Item value="full" aria-label="Full width" className={segment}>
            Full
          </ToggleGroup.Item>
        </ToggleGroup.Root>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {showStates ? (
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger className={cn(toolButton, "group")}>
                <span className="label-mono text-muted max-sm:sr-only">State</span>
                <span>{STATE_LABELS[state] ?? state}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                  className="-mr-1 text-muted transition-transform duration-160 ease-site group-data-[state=open]:rotate-180"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal container={portalTarget}>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  collisionPadding={8}
                  className={cn(
                    "z-50 min-w-44 rounded-card border border-hairline bg-surface p-1 shadow-lg",
                    "origin-(--radix-dropdown-menu-content-transform-origin)",
                    "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
                  )}
                >
                  <DropdownMenu.Label className="px-2 pt-1 pb-1.5 label-mono text-muted">
                    Preview state
                  </DropdownMenu.Label>
                  <DropdownMenu.RadioGroup value={state} onValueChange={setState}>
                    {states.map((value) => (
                      <DropdownMenu.RadioItem
                        key={value}
                        value={value}
                        className={cn(
                          "flex h-8 cursor-default items-center justify-between gap-6 rounded-[4px] px-2 text-14 text-fg outline-none select-none",
                          "data-highlighted:bg-raised pointer-coarse:h-10",
                        )}
                      >
                        {STATE_LABELS[value] ?? value}
                        <DropdownMenu.ItemIndicator>
                          <Check size={16} strokeWidth={1.5} className="text-accent" aria-hidden />
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : null}

          <ToggleGroup.Root
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "light" || value === "dark") setOverride({ mode: value, siteMode });
            }}
            aria-label="Preview theme"
            className={segmented}
          >
            <ToggleGroup.Item value="light" className={segment}>
              <Sun size={16} strokeWidth={1.5} aria-hidden />
              Light
            </ToggleGroup.Item>
            <ToggleGroup.Item value="dark" className={segment}>
              <Moon size={16} strokeWidth={1.5} aria-hidden />
              Dark
            </ToggleGroup.Item>
          </ToggleGroup.Root>

          <button type="button" className={toolButton} onClick={() => post({ type: "replay" })}>
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
            <span className="max-sm:sr-only">Replay</span>
          </button>
        </div>
      </div>

      <div className="rounded-frame border border-hairline bg-raised px-2 pt-2 pb-3 sm:px-8 sm:pt-8">
        <div ref={trackRef} className="relative">
          <div
            data-dragging={dragging ? "" : undefined}
            className={cn(
              "group/stage relative mx-auto h-[560px] max-w-full sm:h-[720px]",
              "transition-[width] duration-450 ease-spring data-dragging:transition-none",
            )}
            style={{ width: available === null ? "100%" : Math.min(target, available) }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-frame border border-hairline bg-surface shadow-sm">
              <iframe
                ref={frameRef}
                src={`/preview/${slug}`}
                title={`${name}, live preview`}
                data-preview=""
                className={cn(
                  "absolute top-0 left-0 block origin-top-left border-0",
                  "transition-[width,height,transform] duration-450 ease-spring",
                  dragging && "pointer-events-none transition-none",
                )}
                style={{
                  width: available === null ? "100%" : target,
                  height: `${100 / scale}%`,
                  transform: scale === 1 ? undefined : `scale(${scale})`,
                }}
              />
            </div>
            <div
              role="separator"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label="Preview width"
              aria-valuemin={STAGE_MIN_WIDTH}
              aria-valuemax={STAGE_MAX_WIDTH}
              aria-valuenow={measured ? target : undefined}
              aria-valuetext={measured ? `${target} pixels${scale < 1 ? `, shown at ${percent}%` : ""}` : "Full width"}
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              onKeyDown={onHandleKeyDown}
              className={cn(
                // Phones resize with the presets: a frame narrower than the screen it sits on has no use there.
                "group absolute top-1/2 -right-8 hidden h-20 w-8 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-control sm:flex",
                "pointer-coarse:-right-[30px] pointer-coarse:w-10",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-12 w-1.5 rounded-full bg-control transition-[background-color,height] duration-160 ease-site",
                  "group-hover:h-16 group-hover:bg-fg group-focus-visible:bg-accent group-data-dragging/stage:bg-accent",
                )}
              />
            </div>
          </div>

          <div
            aria-hidden
            className="mx-auto mt-3 flex max-w-full items-center gap-2 font-mono text-12 text-muted tabular-nums"
            style={{ width: available === null ? "100%" : Math.min(target, available) }}
          >
            <span className="h-2 w-px bg-control" />
            <span className="h-px flex-1 bg-control" />
            <span data-stage-readout className="shrink-0 whitespace-nowrap">
              {measured ? `${target} px${scale < 1 ? ` · ${percent}%` : ""}` : "Full"}
            </span>
            <span className="h-px flex-1 bg-control" />
            <span className="h-2 w-px bg-control" />
          </div>
        </div>
      </div>
    </section>
  );
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
