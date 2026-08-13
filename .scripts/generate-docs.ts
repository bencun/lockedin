import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { format, resolveConfig } from 'prettier';
import PrivacyPolicy from '../entrypoints/privacy/App';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const docsDir = path.join(repoRoot, 'docs');
const publicDir = path.join(repoRoot, 'public');

if (path.dirname(docsDir) !== repoRoot || path.basename(docsDir) !== 'docs') {
  throw new Error(
    `Refusing to replace unexpected output directory: ${docsDir}`,
  );
}

const [fontStyles, privacyStyles, prettierConfig] = await Promise.all([
  readFile(path.join(repoRoot, 'assets/fonts.css'), 'utf8'),
  readFile(path.join(repoRoot, 'entrypoints/privacy/style.css'), 'utf8'),
  resolveConfig(path.join(repoRoot, 'package.json')),
]);

const policyMarkup = renderToStaticMarkup(createElement(PrivacyPolicy));
const policyHtml = await format(
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="LockedIn privacy policy and complete explanation of its local data practices."
    />
    <title>LockedIn Privacy Policy</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    ${policyMarkup}
  </body>
</html>`,
  { ...prettierConfig, parser: 'html' },
);

const indexHtml = await format(
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LockedIn</title>
  </head>
  <body>
    <a href="./policy.html">Privacy policy</a>
  </body>
</html>`,
  { ...prettierConfig, parser: 'html' },
);

const relativeFontStyles = fontStyles.replaceAll(
  "url('/fonts/",
  "url('./fonts/",
);
const styles = await format(
  `/* Generated from assets/fonts.css and entrypoints/privacy/style.css. */
${relativeFontStyles}
${privacyStyles}`,
  { ...prettierConfig, parser: 'css' },
);

await mkdir(docsDir, { recursive: true });
await rm(path.join(docsDir, 'fonts'), { recursive: true, force: true });

try {
  await writeFile(path.join(docsDir, 'index.html'), indexHtml, { flag: 'wx' });
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
}

await Promise.all([
  writeFile(path.join(docsDir, 'policy.html'), policyHtml),
  writeFile(path.join(docsDir, 'style.css'), styles),
  writeFile(path.join(docsDir, '.nojekyll'), ''),
  cp(path.join(publicDir, 'fonts'), path.join(docsDir, 'fonts'), {
    recursive: true,
  }),
  cp(
    path.join(publicDir, 'THIRD_PARTY_NOTICES.txt'),
    path.join(docsDir, 'THIRD_PARTY_NOTICES.txt'),
  ),
]);

console.log(`Generated GitHub Pages privacy policy at ${docsDir}/policy.html`);
