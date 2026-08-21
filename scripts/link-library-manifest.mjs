/**
 * D:BOAN storage linker: replaces local bundle filenames with durable webdev storage URLs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const BUNDLE_DIRECTORY = "/home/ubuntu/webdev-static-assets/dboan-library";
const UPLOAD_LOG = "/home/ubuntu/dboan-library-output/upload-urls.txt";

const log = readFileSync(UPLOAD_LOG, "utf8");
const entries = [...log.matchAll(/\[SUCCESS\] (.+) -> (\/manus-storage\/[^\n]+)/g)];
const urlByFilename = new Map(entries.map(([, sourcePath, url]) => [basename(sourcePath), url]));
const manifestPath = join(BUNDLE_DIRECTORY, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

manifest.items = manifest.items.map((item) => {
  const bundleUrl = urlByFilename.get(item.bundleFile);
  if (!bundleUrl) throw new Error(`Missing uploaded bundle URL for ${item.bundleFile}`);
  return { ...item, bundleUrl };
});

manifest.bundleCount = manifest.items.length;
manifest.storageNotice = "콘텐츠 본문과 소스 예제는 D:BOAN 전용 스토리지에 보관되며, 학습자가 항목을 열 때만 불러옵니다.";
writeFileSync(join(BUNDLE_DIRECTORY, "library-manifest.json"), JSON.stringify(manifest));
console.log(JSON.stringify({ itemCount: manifest.items.length, uploadedBundles: urlByFilename.size }, null, 2));
