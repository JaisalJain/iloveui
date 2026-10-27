// pnpm build-zips: one zip per design (component.tsx, component.html, ai-prompt.md, LICENSE.txt) uploaded to the
// DOWNLOADS R2 bucket as zips/<slug>.zip. Local emulation by default; --remote uploads to the real bucket.
import { licenseText } from "../lib/license";
import { createZip } from "../lib/zip";
import { uploadObjects, type R2Object } from "./lib/r2";
import { listDesignFolders, readDesignFile } from "./lib/registry-files";
import { validateFolder } from "./lib/validate";

async function main() {
  const remote = process.argv.includes("--remote");
  const encoder = new TextEncoder();
  const license = encoder.encode(licenseText());
  const objects: R2Object[] = [];
  for (const folder of listDesignFolders()) {
    const { meta, problems } = validateFolder(folder);
    if (!meta || problems.length > 0) {
      console.error(`✗ ${folder.category}/${folder.slug} is invalid; run pnpm validate-registry`);
      process.exit(1);
    }
    const root = `iloveui-${meta.slug}`;
    const zip = createZip([
      { name: `${root}/component.tsx`, data: encoder.encode(readDesignFile(folder, "component.tsx")) },
      { name: `${root}/component.html`, data: encoder.encode(readDesignFile(folder, "component.html")) },
      { name: `${root}/ai-prompt.md`, data: encoder.encode(readDesignFile(folder, "ai-prompt.md")) },
      { name: `${root}/LICENSE.txt`, data: license },
    ]);
    objects.push({
      key: `zips/${meta.slug}.zip`,
      body: zip,
      contentType: "application/zip",
      contentDisposition: `attachment; filename="${root}.zip"`,
    });
  }
  const { uploaded } = objects.length > 0 ? await uploadObjects(objects, { remote }) : { uploaded: 0 };
  console.log(`✓ zips: ${objects.length} design(s), ${uploaded} uploaded${remote ? " (remote)" : ""}`);
}

main().catch((error: unknown) => {
  console.error(`✗ build-zips: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
