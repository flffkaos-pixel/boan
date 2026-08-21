/**
 * D:BOAN library builder: transforms the user-selected public repository into
 * standalone, lazy-loadable learning bundles while preserving source paths and AGPL attribution.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const REPO_ROOT = "/home/ubuntu/reference-cybersecurity-projects";
const OUTPUT_ROOT = "/home/ubuntu/webdev-static-assets/dboan-library";
const SOURCE_EXTENSIONS = new Set([".py", ".go", ".rs", ".cpp", ".cc", ".c", ".h", ".hpp", ".sh", ".ts", ".tsx", ".js", ".jsx", ".java", ".rb", ".php", ".lua", ".nim", ".v", ".zig", ".sol", ".yml", ".yaml", ".json", ".toml", ".ini", ".conf", ".sql", ".dockerfile"]);
const SOURCE_NAMES = new Set(["dockerfile", "makefile", "justfile", "cmakelists.txt", "cargo.toml", "go.mod", "go.sum", "requirements.txt", "package.json", "pyproject.toml"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".venv", "__pycache__"]);
const MAX_FILE_BYTES = 600_000;

function normalizeId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleFromSlug(slug) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      const acronyms = ["api", "dns", "ddos", "dlp", "cis", "siem", "sbom", "ja3", "ja4", "llm", "c2", "p2p", "hsm", "rveng", "ssh", "tls", "ebpf", "jwt", "oauth", "aws", "ai"];
      return acronyms.includes(part.toLowerCase()) ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
}

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function readText(path) {
  const size = statSync(path).size;
  if (size > MAX_FILE_BYTES) return null;
  const text = readFileSync(path, "utf8");
  return text.includes("\u0000") ? null : text;
}

function getMarkdownTitle(markdown, fallback) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim();
  return title || fallback;
}

function getSummary(markdown, fallback) {
  const lines = markdown.split("\n");
  const candidate = lines
    .map((line) => line.trim())
    .find((line) => line.length > 48 && !line.startsWith("#") && !line.startsWith("!") && !line.startsWith("[") && !line.startsWith("<") && !line.startsWith("|"));
  return candidate ? candidate.replace(/[*_`]/g, "").slice(0, 220) : fallback;
}

function sourceLanguage(path) {
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  const map = { ".py": "python", ".go": "go", ".rs": "rust", ".cpp": "cpp", ".cc": "cpp", ".c": "c", ".h": "c", ".hpp": "cpp", ".sh": "bash", ".ts": "typescript", ".tsx": "tsx", ".js": "javascript", ".jsx": "jsx", ".java": "java", ".rb": "ruby", ".php": "php", ".lua": "lua", ".nim": "nim", ".v": "v", ".zig": "zig", ".sol": "solidity", ".sql": "sql", ".json": "json", ".yml": "yaml", ".yaml": "yaml", ".toml": "toml" };
  return map[extension] || "text";
}

function isSource(path) {
  const file = basename(path).toLowerCase();
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  return SOURCE_EXTENSIONS.has(extension) || SOURCE_NAMES.has(file);
}

function makeBundle({ id, title, type, tier, sourcePath, primaryDocs, sourceFiles, relatedDocs = [] }) {
  const docs = primaryDocs.map((path) => {
    const content = readText(path);
    return content ? { path: relative(REPO_ROOT, path), title: getMarkdownTitle(content, basename(path, ".md")), content } : null;
  }).filter(Boolean);
  const code = sourceFiles.map((path) => {
    const content = readText(path);
    return content ? { path: relative(REPO_ROOT, path), language: sourceLanguage(path), content } : null;
  }).filter(Boolean);
  const additional = relatedDocs.map((path) => {
    const content = readText(path);
    return content ? { path: relative(REPO_ROOT, path), title: getMarkdownTitle(content, basename(path, ".md")), content } : null;
  }).filter(Boolean);
  const primaryContent = docs[0]?.content || additional[0]?.content || "";

  return {
    id,
    title,
    type,
    tier,
    sourcePath: relative(REPO_ROOT, sourcePath),
    summary: getSummary(primaryContent, `${title} 학습 자료`),
    attribution: {
      repository: "CarterPerez-dev/Cybersecurity-Projects",
      license: "AGPL-3.0",
      notice: "D:BOAN 내부 학습 자료는 CarterPerez-dev/Cybersecurity-Projects의 공개 콘텐츠를 바탕으로 구성되었습니다.",
    },
    documents: [...docs, ...additional],
    sourceFiles: code,
  };
}

function writeBundle(bundle) {
  const filename = `${bundle.id}.json`;
  writeFileSync(join(OUTPUT_ROOT, filename), JSON.stringify(bundle));
  return filename;
}

function buildProjectItems() {
  const projectsRoot = join(REPO_ROOT, "PROJECTS");
  const items = [];
  for (const tier of readdirSync(projectsRoot)) {
    const tierPath = join(projectsRoot, tier);
    if (!statSync(tierPath).isDirectory()) continue;
    for (const project of readdirSync(tierPath)) {
      const projectPath = join(tierPath, project);
      if (!statSync(projectPath).isDirectory()) continue;
      const allFiles = listFiles(projectPath);
      const docs = allFiles.filter((file) => file.toLowerCase().endsWith(".md"));
      const sources = allFiles.filter(isSource);
      const readme = docs.find((file) => basename(file).toLowerCase() === "readme.md");
      const firstDoc = readme || docs[0];
      const title = titleFromSlug(project);
      const bundle = makeBundle({
        id: `project-${tier}-${project}`,
        title,
        type: "프로젝트",
        tier: tier.charAt(0).toUpperCase() + tier.slice(1),
        sourcePath: projectPath,
        primaryDocs: readme ? [readme] : [],
        relatedDocs: docs.filter((file) => file !== readme),
        sourceFiles: sources,
      });
      items.push({
        id: bundle.id,
        title: bundle.title,
        type: bundle.type,
        tier: bundle.tier,
        summary: bundle.summary,
        sourcePath: bundle.sourcePath,
        documentCount: bundle.documents.length,
        sourceCount: bundle.sourceFiles.length,
        bundleFile: writeBundle(bundle),
      });
    }
  }
  return items;
}

function buildMarkdownItems(directoryName, type) {
  const root = join(REPO_ROOT, directoryName);
  return listFiles(root)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .map((path) => {
      const content = readText(path);
      if (!content) return null;
      const title = getMarkdownTitle(content, titleFromSlug(basename(path, ".md")));
      const tier = relative(root, path).split("/")[0];
      const bundle = makeBundle({
        id: `${normalizeId(type)}-${normalizeId(relative(root, path))}`,
        title,
        type,
        tier: tier === basename(path) ? "공통" : titleFromSlug(tier),
        sourcePath: path,
        primaryDocs: [path],
        sourceFiles: [],
      });
      return {
        id: bundle.id,
        title: bundle.title,
        type: bundle.type,
        tier: bundle.tier,
        summary: bundle.summary,
        sourcePath: bundle.sourcePath,
        documentCount: bundle.documents.length,
        sourceCount: 0,
        bundleFile: writeBundle(bundle),
      };
    })
    .filter(Boolean);
}

rmSync(OUTPUT_ROOT, { recursive: true, force: true });
mkdirSync(OUTPUT_ROOT, { recursive: true });

const items = [
  ...buildProjectItems(),
  ...buildMarkdownItems("SYNOPSES", "개요"),
  ...buildMarkdownItems("ROADMAPS", "로드맵"),
  ...buildMarkdownItems("RESOURCES", "리소스"),
].sort((a, b) => a.title.localeCompare(b.title));

const licenseText = readText(join(REPO_ROOT, "LICENSE"));
const manifest = {
  generatedAt: new Date().toISOString(),
  repository: "CarterPerez-dev/Cybersecurity-Projects",
  license: "AGPL-3.0",
  notice: "이 라이브러리는 선택된 공개 저장소의 콘텐츠를 D:BOAN 내부에서 읽고 학습할 수 있도록 재구성한 것입니다. 원작자와 AGPL-3.0 라이선스 고지를 유지합니다.",
  licenseText,
  items,
};
writeFileSync(join(OUTPUT_ROOT, "manifest.json"), JSON.stringify(manifest));
console.log(JSON.stringify({ output: OUTPUT_ROOT, itemCount: items.length, projectCount: items.filter((item) => item.type === "프로젝트").length }, null, 2));
