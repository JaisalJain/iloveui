import { tsImport } from "tsx/esm/api";

// The rehype step for every MDX file in content/ (next.config.ts passes it to @next/mdx as an absolute path,
// because Turbopack only accepts serializable plugin options). It runs at build time in Node, so none of this
// reaches a Worker or a browser:
// - h2 and h3 get stable ids, and the file exports `toc` (the headings in order) for the on-page contents;
// - fenced code becomes <CodeBlock html code language title />, highlighted with the site's own shiki theme
//   (scripts/lib/highlight.ts, loaded through tsx because it is TypeScript).

const { highlight } = await tsImport("../../scripts/lib/highlight.ts", import.meta.url);

const LANGUAGES = {
  tsx: "tsx",
  ts: "tsx",
  typescript: "tsx",
  jsx: "tsx",
  js: "tsx",
  javascript: "tsx",
  html: "html",
  css: "css",
  json: "json",
  jsonc: "json",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
};

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);
}

/** Code in a language the highlighter does not know, in the same markup the highlighter emits. */
function plainHtml(code) {
  const lines = code
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => `<span class="line">${escapeHtml(line)}</span>`);
  return `<pre class="iu-code"><code>${lines.join("\n")}</code></pre>`;
}

function textOf(node) {
  if (node.type === "text") return node.value;
  if ("children" in node && Array.isArray(node.children)) return node.children.map(textOf).join("");
  return "";
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[`'".,:;!?()[\]{}<>/\\@*+=~^$|]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

function attribute(name, value) {
  return { type: "mdxJsxAttribute", name, value };
}

function codeBlock(pre) {
  const code = pre.children.find((child) => child.type === "element" && child.tagName === "code");
  if (!code) return null;
  const classes = Array.isArray(code.properties?.className) ? code.properties.className : [];
  const declared = classes.find((name) => String(name).startsWith("language-"));
  const language = declared ? String(declared).slice("language-".length).toLowerCase() : "text";
  const meta = typeof code.data?.meta === "string" ? code.data.meta : "";
  const title = /title="([^"]+)"/.exec(meta)?.[1];
  const source = textOf(code).replace(/\n$/, "");
  const known = LANGUAGES[language];
  const html = known ? highlight(source, known) : plainHtml(source);
  const attributes = [attribute("html", html), attribute("code", source), attribute("language", language)];
  if (title) attributes.push(attribute("title", title));
  return { type: "mdxJsxFlowElement", name: "CodeBlock", attributes, children: [] };
}

/** A plain value as an ESTree expression, for the generated `export const toc`. */
function toEstree(value) {
  if (Array.isArray(value)) return { type: "ArrayExpression", elements: value.map(toEstree) };
  if (value !== null && typeof value === "object") {
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, item]) => ({
        type: "Property",
        kind: "init",
        key: { type: "Identifier", name: key },
        value: toEstree(item),
        method: false,
        shorthand: false,
        computed: false,
      })),
    };
  }
  return { type: "Literal", value, raw: JSON.stringify(value) };
}

function exportConst(name, value) {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            source: null,
            attributes: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [{ type: "VariableDeclarator", id: { type: "Identifier", name }, init: toEstree(value) }],
            },
          },
        ],
      },
    },
  };
}

export default function rehypeDocs() {
  return (tree) => {
    const toc = [];
    const used = new Map();

    function walk(parent) {
      if (!Array.isArray(parent.children)) return;
      parent.children.forEach((node, index) => {
        if (node.type !== "element") {
          walk(node);
          return;
        }
        if (node.tagName === "pre") {
          const replacement = codeBlock(node);
          if (replacement) {
            parent.children[index] = replacement;
            return;
          }
        }
        if (node.tagName === "h2" || node.tagName === "h3") {
          const title = textOf(node).trim();
          const base = slugify(title);
          const count = used.get(base) ?? 0;
          used.set(base, count + 1);
          const id = count === 0 ? base : `${base}-${count + 1}`;
          node.properties = { ...node.properties, id };
          toc.push({ id, title, depth: node.tagName === "h2" ? 2 : 3 });
        }
        walk(node);
      });
    }

    walk(tree);
    tree.children.unshift(exportConst("toc", toc));
  };
}
