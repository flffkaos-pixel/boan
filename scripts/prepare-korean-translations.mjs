/**
 * D:BOAN translation preparation: creates chunked prose-only prompts and metadata prompts from public learning bundles.
 * Code fences are replaced with stable placeholders so the Korean translation never mutates executable examples.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BUNDLE_DIR = "/home/ubuntu/webdev-static-assets/dboan-library";
const OUTPUT_DIR = "/home/ubuntu/dboan-library-output";
const CHUNK_LIMIT = 9000;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function splitMarkdownForTranslation(markdown) {
  const codeBlocks = [];
  const masked = markdown.replace(/```[\s\S]*?```/g, (block) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(block);
    return `\n\n${token}\n\n`;
  });

  const paragraphs = masked.split(/(\n{2,})/);
  const chunks = [];
  let current = "";
  for (const part of paragraphs) {
    if (current.length && current.length + part.length > CHUNK_LIMIT) {
      chunks.push(current);
      current = "";
    }
    current += part;
  }
  if (current.trim()) chunks.push(current);
  return { codeBlocks, chunks };
}

const bundleFiles = readdirSync(BUNDLE_DIR)
  .filter((filename) => filename.endsWith(".json") && filename !== "manifest.json" && filename !== "library-manifest.json")
  .sort();

const documentChunks = [];
const documentMap = [];
const metadataPrompts = [];
const metadataMap = [];
let documentCharacters = 0;

for (const bundleFile of bundleFiles) {
  const bundle = readJson(join(BUNDLE_DIR, bundleFile));
  const metadataIndex = metadataPrompts.length;
  metadataPrompts.push(`제목: ${bundle.title}\n요약: ${bundle.summary}`);
  metadataMap.push({ bundleFile, metadataIndex });

  const documents = Array.isArray(bundle.documents) ? bundle.documents : [];
  documents.forEach((document, documentIndex) => {
    const { codeBlocks, chunks } = splitMarkdownForTranslation(document.content || "");
    const chunkIndexes = chunks.map((chunk) => {
      const chunkIndex = documentChunks.length;
      documentChunks.push(chunk);
      documentCharacters += chunk.length;
      return chunkIndex;
    });
    documentMap.push({ bundleFile, documentIndex, chunkIndexes, codeBlocks });
  });
}

writeFileSync(join(OUTPUT_DIR, "korean-document-chunks.json"), JSON.stringify(documentChunks));
writeFileSync(join(OUTPUT_DIR, "korean-document-map.json"), JSON.stringify(documentMap));
writeFileSync(join(OUTPUT_DIR, "korean-metadata-inputs.json"), JSON.stringify(metadataPrompts));
writeFileSync(join(OUTPUT_DIR, "korean-metadata-map.json"), JSON.stringify(metadataMap));
writeFileSync(join(OUTPUT_DIR, "korean-translation-stats.json"), JSON.stringify({
  bundleCount: bundleFiles.length,
  documentCount: documentMap.length,
  documentChunkCount: documentChunks.length,
  documentCharacters,
  metadataCount: metadataPrompts.length,
}, null, 2));

console.log(readFileSync(join(OUTPUT_DIR, "korean-translation-stats.json"), "utf8"));
