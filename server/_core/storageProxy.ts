import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
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
  });
}
