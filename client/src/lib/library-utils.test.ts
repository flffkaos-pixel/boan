import { describe, expect, it } from "vitest";
import { filterLibraryItems, getItemTags, getReadableTier, toInternalReadingMarkdown, type LibraryItem } from "./library-utils";

const items: LibraryItem[] = [
  { id: "1", title: "HTTP 헤더 스캐너", originalTitle: "HTTP Headers Scanner", type: "프로젝트", tier: "Foundations", summary: "보안 헤더를 감사합니다", originalSummary: "Audit security headers", sourcePath: "PROJECTS/foundations/http-headers-scanner", documentCount: 3, sourceCount: 2, bundleUrl: "/one" },
  { id: "2", title: "Cloud Security Compliance", type: "개요", tier: "Advanced", summary: "Multi cloud controls", sourcePath: "SYNOPSES/advanced/cloud.md", documentCount: 1, sourceCount: 0, bundleUrl: "/two" },
];

describe("internal library filtering", () => {
  it("filters catalog items with an internal title query", () => {
    expect(filterLibraryItems(items, "headers", "전체", "전체").map((item) => item.id)).toEqual(["1"]);
  });

  it("combines item type and learning tier filters", () => {
    expect(filterLibraryItems(items, "", "프로젝트", "Foundations")).toHaveLength(1);
    expect(filterLibraryItems(items, "", "프로젝트", "Advanced")).toHaveLength(0);
  });

  it("maps repository tiers to Korean learning labels", () => {
    expect(getReadableTier("Intermediate")).toBe("중급");
  });

  it("classifies catalog records with practical topic tags", () => {
    expect(getItemTags(items[0])).toContain("웹 보안");
  });

  it("narrows searched records further with a topic tag", () => {
    expect(filterLibraryItems(items, "", "전체", "전체", "웹 보안").map((item) => item.id)).toEqual(["1"]);
  });

  it("turns external markdown links and badge images into internal-reading text", () => {
    const markdown = "[Source](https://github.com/example/project) ![CI](https://img.shields.io/badge/ci-pass)";
    expect(toInternalReadingMarkdown(markdown)).toBe("Source [CI]");
  });

  it("neutralizes a badge nested inside an external project link", () => {
    const markdown = "[![Cybersecurity Projects](https://img.shields.io/badge/project)](https://github.com/example/project)";
    const result = toInternalReadingMarkdown(markdown);
    expect(result).not.toContain("https://");
    expect(result).toContain("Cybersecurity Projects");
  });

  it("neutralizes relative source-document links inside the internal reader", () => {
    expect(toInternalReadingMarkdown("[Architecture](learn/02-ARCHITECTURE.md)")).toBe("Architecture");
  });
});
