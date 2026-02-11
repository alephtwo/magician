import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import * as path from "node:path";

const paths = {
  src: path.join(import.meta.dirname, "..", "src"),
  dist: path.join(import.meta.dirname, "..", "dist"),
};

const common: BuildOptions = {
  entryPoints: [path.join(paths.src, "index.mts")],
  platform: "neutral",
  logLevel: "info",
};

const builds: BuildOptions[] = [
  { format: "esm", outfile: path.join(paths.dist, "magician.mjs") },
  { format: "cjs", outfile: path.join(paths.dist, "magician.cjs") },
  {
    format: "iife",
    outfile: path.join(paths.dist, "magician.iife.js"),
    globalName: "Magician",
    platform: "browser",
  },
];

await Promise.all(
  builds.map((build) => esbuild.build({ ...common, ...build })),
);
