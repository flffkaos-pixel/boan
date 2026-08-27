import type { Express } from "express";
import { ENV } from "./env";
import fs from "fs";
import path from "path";

export function registerStorageProxy(app: Express) {
  const handler = async (req: Parameters<Parameters<Express["get"]>[1]>[0], res: Parameters<Parameters<Express["get"]>[1]>[1]) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      // Fallback for free deployment without env vars
      const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(key);
      if (isImage) {
        const placeholder = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1YAAAAASUVORK5CYII=",
          "base64"
        );
        res.set("Content-Type", "image/png");
        res.set("Cache-Control", "no-store");
        res.send(placeholder);
        return;
      }

      if (key === "korean-cybersecurity-projects.md") {
        const filePath = path.join(__dirname, "..", "..", "client", "public", "korean-cybersecurity-projects.md");
        const data = readFileSync(filePath, "utf8");
        res.set("Content-Type", "text/markdown; charset=utf-8");
        res.set("Cache-Control", "no-store");
        res.send(data);
        return;
      }

      if (key === "korean-cybersecurity-bundle.json") {
        const mdPath = path.join(__dirname, "..", "..", "client", "public", "korean-cybersecurity-projects.md");
        const md = readFileSync(mdPath, "utf8");
        const bundle = {
          id: "cybersecurity-projects-ko",
          title: "사이버보안 프로젝트 70선",
          type: "프로젝트",
          tier: "Foundations",
          sourcePath: "cybersecurity-projects",
          summary: "Foundations부터 Advanced까지 70개의 사이버보안 프로젝트를 한국어로 정리한 자료입니다.",
          attribution: { repository: "CarterPerez-dev/Cybersecurity-Projects", license: "AGPL-3.0", notice: "한국어 번역본" },
          translation: { language: "ko", originalLanguage: "en", notice: "문서 설명은 한국어 번역을 기본으로 제공합니다." },
          documents: [
            { path: "korean-cybersecurity-projects.md", title: "사이버보안 프로젝트 전체", content: md }
          ],
          sourceFiles: []
        };
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(JSON.stringify(bundle));
        return;
      }

      if (key === "korean-library-manifest.json") {
        const filePath = path.join(__dirname, "..", "..", "client", "public", "korean-library-manifest.json");
        const data = readFileSync(filePath, "utf8");
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(data);
        return;
      }

      if (key === "korean-library-bundle.json") {
        const filePath = path.join(__dirname, "..", "..", "client", "public", "korean-library-bundle.json");
        const data = readFileSync(filePath, "utf8");
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(data);
        return;
      }

      if (key === "korean-library-manifest_08aae5f0.json") {
        const manifest = {
          repository: "TRACE//LAB",
          license: "AGPL-3.0",
          notice: "Free deployment fallback manifest",
          licenseText: "AGPL-3.0",
          storageNotice: "Storage disabled in free mode",
          bundleCount: 1,
          defaultLanguage: "ko" as const,
          items: [
            {
              id: "fallback-demo",
              title: "데모 자료",
              type: "개요",
              tier: "Beginner",
              summary: "환경변수 없이 동작하는 데모 자료입니다. 실제 자료는 Forge API가 설정된 후 볼 수 있습니다.",
              sourcePath: "demo/fallback",
              documentCount: 1,
              sourceCount: 0,
              bundleUrl: "/manus-storage/demo-bundle.json",
            }
          ]
        };
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(JSON.stringify(manifest));
        return;
      }

      if (key === "demo-bundle.json") {
        const bundle = {
          id: "fallback-demo",
          title: "데모 자료",
          type: "개요",
          tier: "Beginner",
          sourcePath: "demo/fallback",
          summary: "환경변수 없이 동작하는 데모 자료입니다.",
          attribution: { repository: "TRACE//LAB", license: "AGPL-3.0", notice: "Demo" },
          documents: [
            { path: "README.md", title: "소개", content: "# 데모\n환경변수가 설정되지 않아 실제 자료를 불러올 수 없습니다.\n\n실제 학습 자료를 보려면 `BUILT_IN_FORGE_API_URL` 및 `BUILT_IN_FORGE_API_KEY` 를 설정하세요." }
          ],
          sourceFiles: []
        };
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(JSON.stringify(bundle));
        return;
      }

      if (key.endsWith(".json")) {
        // Generic fallback for any other JSON bundle
        const bundle = {
          id: "fallback-generic",
          title: "자료를 불러올 수 없습니다",
          type: "개요",
          tier: "Beginner",
          sourcePath: "fallback",
          summary: "Forge API가 설정되지 않아 자료를 불러올 수 없습니다.",
          attribution: { repository: "TRACE//LAB", license: "AGPL-3.0", notice: "Demo" },
          documents: [
            { path: "README.md", title: "안내", content: "# 안내\n이 자료는 환경변수 설정 후 사용할 수 있습니다." }
          ],
          sourceFiles: []
        };
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "no-store");
        res.send(JSON.stringify(bundle));
        return;
      }

      if (key.endsWith(".zip")) {
        res.status(404).send("소스 패키지는 환경변수 설정 후 다운로드 가능합니다.");
        return;
      }

      res.status(404).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };

  app.get("/manus-storage/*", handler);
  app.get("/api/manus-storage/*", handler);
}
