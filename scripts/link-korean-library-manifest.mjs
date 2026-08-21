/**
 * D:BOAN Korean library manifest linker: attaches translated storage bundles to the public source catalog.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SOURCE_DIR = "/home/ubuntu/webdev-static-assets/dboan-library";
const KOREAN_DIR = "/home/ubuntu/webdev-static-assets/dboan-library-korean";
const UPLOAD_LOG = "/home/ubuntu/dboan-library-output/korean-upload-urls.txt";

const manifest = JSON.parse(readFileSync(join(SOURCE_DIR, "library-manifest.json"), "utf8"));
const bundleMap = JSON.parse(readFileSync(join(KOREAN_DIR, "korean-bundle-map.json"), "utf8"));
const uploadLog = readFileSync(UPLOAD_LOG, "utf8");
const urlByFilename = new Map([...uploadLog.matchAll(/\[SUCCESS\] (.+) -> (\/manus-storage\/[^\n]+)/g)].map(([, path, url]) => [basename(path), url]));
const translationByBundle = new Map(bundleMap.map((item) => [item.bundleFile, item]));

manifest.items = manifest.items.map((item) => {
  const translation = translationByBundle.get(item.bundleFile);
  if (!translation) throw new Error(`Missing translation metadata for ${item.bundleFile}`);
  const koreanBundleUrl = urlByFilename.get(translation.koreanBundleFile);
  if (!koreanBundleUrl) throw new Error(`Missing storage URL for ${translation.koreanBundleFile}`);
  return {
    ...item,
    originalTitle: item.title,
    originalSummary: item.summary,
    title: translation.title,
    summary: translation.summary,
    originalBundleUrl: item.bundleUrl,
    koreanBundleUrl,
    bundleUrl: koreanBundleUrl,
  };
});
manifest.defaultLanguage = "ko";
manifest.translationNotice = "문서 설명은 한국어 번역을 기본으로 제공하며, 코드·명령어·식별자·경로는 원문을 보존합니다. 필요할 때 원문 영어로 전환할 수 있습니다.";
writeFileSync(join(KOREAN_DIR, "korean-library-manifest.json"), JSON.stringify(manifest));
console.log(JSON.stringify({ itemCount: manifest.items.length, koreanBundleCount: bundleMap.length }, null, 2));
