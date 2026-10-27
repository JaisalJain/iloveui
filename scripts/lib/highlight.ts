import { createHighlighterCoreSync, type ShikiTransformer, type ThemeRegistration } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "@shikijs/langs/bash";
import css from "@shikijs/langs/css";
import html from "@shikijs/langs/html";
import json from "@shikijs/langs/json";
import tsx from "@shikijs/langs/tsx";

// Code highlighting derived from the site tokens: the site's neutrals plus a warm tint (from the light canvas hue)
// and a cool tint (from the dark neutral hue). Tokens are emitted as short classes (k-fg, k-comment, k-punct,
// k-warm, k-cool, plus k-italic); app/globals.css colors them per theme, which keeps highlighted code small.

const ROLES = {
  fg: "#111111",
  comment: "#6E6E73",
  punct: "#5C5C62",
  warm: "#78512A",
  cool: "#555378",
} as const;

type Role = keyof typeof ROLES;
const ROLE_BY_COLOR = new Map<string, Role>(Object.entries(ROLES).map(([role, color]) => [color, role as Role]));

const theme: ThemeRegistration = {
  name: "iloveui",
  type: "light",
  fg: ROLES.fg,
  bg: "#FFFFFF",
  settings: [
    { settings: { foreground: ROLES.fg } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: ROLES.comment, fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new"],
      settings: { foreground: ROLES.warm },
    },
    {
      scope: ["string", "string.template", "punctuation.definition.string", "string.quoted"],
      settings: { foreground: ROLES.cool },
    },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: ROLES.warm } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: ROLES.fg } },
    {
      scope: ["entity.name.tag", "support.class.component", "entity.name.type", "support.type"],
      settings: { foreground: ROLES.warm },
    },
    {
      scope: ["entity.other.attribute-name", "support.type.property-name", "meta.property-name"],
      settings: { foreground: ROLES.cool },
    },
    { scope: ["variable.parameter"], settings: { foreground: ROLES.fg, fontStyle: "italic" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: ROLES.punct } },
  ],
};

/** Replaces inline color styles with role classes. */
const toRoleClasses: ShikiTransformer = {
  name: "iloveui:role-classes",
  pre(node) {
    node.properties.class = "iu-code";
    delete node.properties.style;
    delete node.properties.tabindex;
  },
  span(node) {
    const style = String(node.properties.style ?? "");
    delete node.properties.style;
    const color = /color:\s*(#[0-9A-Fa-f]{6})/.exec(style)?.[1]?.toUpperCase();
    const classes: string[] = [];
    const role = color ? ROLE_BY_COLOR.get(color) : undefined;
    if (role && role !== "fg") classes.push(`k-${role}`);
    if (/font-style:\s*italic/.test(style)) classes.push("k-italic");
    if (classes.length > 0) node.properties.class = classes.join(" ");
  },
  line(node) {
    // Unwrap plain spans into text and merge neighbours that share a class.
    type Child = (typeof node.children)[number];
    const merged: Child[] = [];
    for (const child of node.children) {
      const flat: Child[] =
        child.type === "element" && child.tagName === "span" && !child.properties.class ? child.children : [child];
      for (const item of flat) {
        const last = merged.at(-1);
        if (item.type === "text" && last?.type === "text") {
          last.value += item.value;
        } else if (
          item.type === "element" &&
          last?.type === "element" &&
          String(item.properties.class) === String(last.properties.class) &&
          item.children.every((c) => c.type === "text") &&
          last.children.every((c) => c.type === "text")
        ) {
          const lastText = last.children[0];
          const itemText = item.children.map((c) => (c.type === "text" ? c.value : "")).join("");
          if (lastText?.type === "text") lastText.value += itemText;
        } else {
          merged.push(item);
        }
      }
    }
    node.children = merged;
  },
};

const highlighter = createHighlighterCoreSync({
  themes: [theme],
  langs: [tsx, html, css, bash, json],
  engine: createJavaScriptRegexEngine(),
});

export type HighlightLanguage = "tsx" | "html" | "css" | "bash" | "json";

export function highlight(code: string, lang: HighlightLanguage): string {
  return highlighter.codeToHtml(code.replace(/\n$/, ""), {
    lang,
    theme: "iloveui",
    transformers: [toRoleClasses],
  });
}
