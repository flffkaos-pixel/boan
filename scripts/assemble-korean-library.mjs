/**
 * D:BOAN Korean archive assembler: merges retry translations, restores protected code fences, and emits Korean bundles.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BUNDLE_DIR = "/home/ubuntu/webdev-static-assets/dboan-library";
const OUTPUT_DIR = "/home/ubuntu/dboan-library-output";
const KOREAN_DIR = "/home/ubuntu/webdev-static-assets/dboan-library-korean";
mkdirSync(KOREAN_DIR, { recursive: true });

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function readJsonl(path) { return readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
function headingFromMarkdown(markdown, fallback) {
  return markdown.match(/^#{1,3}\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim() || fallback;
}

const primaryResults = readJsonl(`${OUTPUT_DIR}/korean-document-output.jsonl`);
const retryResults = readJsonl(`${OUTPUT_DIR}/korean-google-retry-output.jsonl`);
const retryMap = readJson(`${OUTPUT_DIR}/korean-retry-map.json`);
const documentMap = readJson(`${OUTPUT_DIR}/korean-document-map.json`);
const metadataMap = readJson(`${OUTPUT_DIR}/korean-metadata-map.json`);
const metadataResults = readJsonl(`${OUTPUT_DIR}/korean-metadata-output.jsonl`);

const translatedChunks = new Map();
for (const result of primaryResults) if (!result.error && result.output) translatedChunks.set(result.index, result.output);
for (const mapping of retryMap) {
  const content = mapping.retryIndexes.map((index) => retryResults[index]?.output || "").join("");
  if (!content.trim()) throw new Error(`Missing retry translation for original chunk ${mapping.originalIndex}`);
  translatedChunks.set(mapping.originalIndex, content);
}

const metadataByBundle = new Map();
for (const { bundleFile, metadataIndex } of metadataMap) {
  const output = metadataResults[metadataIndex]?.output || "";
  const title = output.match(/제목:\s*(.+)/)?.[1]?.trim();
  const summary = output.match(/요약:\s*([\s\S]+)/)?.[1]?.trim();
  metadataByBundle.set(bundleFile, { title, summary });
}

const documentsByBundle = new Map();
for (const mapping of documentMap) {
  const content = mapping.chunkIndexes.map((index) => translatedChunks.get(index)).join("");
  let restored = content;
  mapping.codeBlocks.forEach((block, index) => { restored = restored.replaceAll(`@@CODE_BLOCK_${index}@@`, block); });
  if (!documentsByBundle.has(mapping.bundleFile)) documentsByBundle.set(mapping.bundleFile, new Map());
  documentsByBundle.get(mapping.bundleFile).set(mapping.documentIndex, restored);
}

const koreanBundleMap = [];
for (const bundleFile of readdirSync(BUNDLE_DIR).filter((filename) => filename.endsWith(".json") && filename !== "manifest.json" && filename !== "library-manifest.json")) {
  const bundle = readJson(join(BUNDLE_DIR, bundleFile));
  const koreanMetadata = metadataByBundle.get(bundleFile) || {};
  const koreanDocuments = documentsByBundle.get(bundleFile) || new Map();
  const documents = (bundle.documents || []).map((document, index) => {
    const koreanContent = koreanDocuments.get(index) || document.content;
    return { ...document, title: headingFromMarkdown(koreanContent, document.title), content: koreanContent };
  });
  const koreanBundle = {
    ...bundle,
    title: koreanMetadata.title || bundle.title,
    summary: koreanMetadata.summary || bundle.summary,
    documents,
    translation: {
      language: "ko",
      originalLanguage: "en",
      notice: "D:BOAN이 학습 편의를 위해 제공하는 한국어 번역입니다. 코드·명령어·식별자·경로는 원문을 유지했습니다.",
    },
  };
  const koreanBundleFile = `ko-${bundleFile}`;
  writeFileSync(join(KOREAN_DIR, koreanBundleFile), JSON.stringify(koreanBundle));
  koreanBundleMap.push({ bundleFile, koreanBundleFile, title: koreanBundle.title, summary: koreanBundle.summary });
}
writeFileSync(join(KOREAN_DIR, "korean-bundle-map.json"), JSON.stringify(koreanBundleMap));
console.log(JSON.stringify({ translatedBundles: koreanBundleMap.length, translatedDocuments: documentMap.length }, null, 2));
