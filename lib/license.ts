// The MIT License that covers the site and every design. Rendered on /license and shipped as LICENSE.txt in every
// download; tests/unit/license.test.ts keeps it identical to the LICENSE file at the repository root.
export const LICENSE_TITLE = "MIT License";

export const COPYRIGHT_LINE = "Copyright (c) 2026 Jaisal K Jain";

/** The license body as wrapped in the LICENSE file, one string per paragraph. */
const PARAGRAPHS = [
  `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:`,
  `The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.`,
  `THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
];

/** The paragraphs unwrapped, for reflowing text on /license. */
export const LICENSE_PARAGRAPHS: readonly string[] = PARAGRAPHS.map((paragraph) => paragraph.replace(/\n/g, " "));

/** Plain-text version for LICENSE.txt in downloads, identical to the repository's LICENSE file. */
export function licenseText(): string {
  return `${[LICENSE_TITLE, COPYRIGHT_LINE, ...PARAGRAPHS].join("\n\n")}\n`;
}
