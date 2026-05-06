/**
 * One-shot migration: extract data arrays from images.{generated,metadata}.ts
 * into JSON sibling files. The .ts files become thin re-exports so admin code
 * can mutate JSON without TS AST manipulation.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { generatedImages } from "../content/images.generated";
import { photoMetadata } from "../content/images.metadata";

const root = join(__dirname, "..", "content");

writeFileSync(
  join(root, "images.generated.json"),
  JSON.stringify(generatedImages, null, 2) + "\n",
);
writeFileSync(
  join(root, "images.metadata.json"),
  JSON.stringify(photoMetadata, null, 2) + "\n",
);

console.log(
  `Wrote ${generatedImages.length} generated + ${photoMetadata.length} metadata entries to JSON.`,
);
