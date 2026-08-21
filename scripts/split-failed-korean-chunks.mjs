/**
 * D:BOAN retry splitter: retries only failed translations with smaller, paragraph-safe excerpts.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUTPUT_DIR = "/home/ubuntu/dboan-library-output";
const LIMIT = 2600;
const results = readFileSync(`${OUTPUT_DIR}/korean-document-output.jsonl`, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function splitText(text) {
  const parts = text.split(/(\n{2,})/);
  const chunks = [];
  let current = "";
  for (const part of parts) {
    if (current.length && current.length + part.length > LIMIT) {
      chunks.push(current);
      current = "";
    }
    if (part.length > LIMIT) {
      for (let position = 0; position < part.length; position += LIMIT) chunks.push(part.slice(position, position + LIMIT));
    } else {
      current += part;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

const retryInputs = [];
const retryMap = [];
for (const result of results.filter((item) => item.error)) {
  const retryIndexes = splitText(result.input).map((chunk) => {
    const index = retryInputs.length;
    retryInputs.push(chunk);
    return index;
  });
  retryMap.push({ originalIndex: result.index, retryIndexes });
}

writeFileSync(`${OUTPUT_DIR}/korean-retry-inputs.json`, JSON.stringify(retryInputs));
writeFileSync(`${OUTPUT_DIR}/korean-retry-map.json`, JSON.stringify(retryMap));
writeFileSync(`${OUTPUT_DIR}/korean-retry-sample.json`, JSON.stringify(retryInputs.slice(0, 5)));
console.log(JSON.stringify({ failedOriginalChunks: retryMap.length, retryChunks: retryInputs.length }, null, 2));
