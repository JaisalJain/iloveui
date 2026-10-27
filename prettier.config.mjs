/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
const config = {
  printWidth: 120,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./app/globals.css",
  tailwindFunctions: ["cn", "clsx", "cx"],
  overrides: [
    {
      // Catalog designs compile against the preview stylesheet, not the site's.
      files: ["registry/**"],
      options: { tailwindStylesheet: "./app/(preview)/preview.css" },
    },
  ],
};

export default config;
