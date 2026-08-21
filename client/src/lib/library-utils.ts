/**
 * TRACE//LAB library utilities: deterministic filtering for the internal, source-attributed learning catalog.
 */
export type LibraryItem = {
  id: string;
  title: string;
  originalTitle?: string;
  type: string;
  tier: string;
  summary: string;
  originalSummary?: string;
  sourcePath: string;
  documentCount: number;
  sourceCount: number;
  bundleUrl: string;
  originalBundleUrl?: string;
  koreanBundleUrl?: string;
};

export const TOPIC_TAGS = ["전체", "웹 보안", "네트워크", "인증·시크릿", "클라우드·컨테이너", "위협 탐지", "안전한 개발", "포렌식·분석", "개인정보"] as const;
export type TopicTag = (typeof TOPIC_TAGS)[number];

export function getItemTags(item: LibraryItem): TopicTag[] {
  const haystack = `${item.title} ${item.originalTitle || ""} ${item.summary} ${item.originalSummary || ""} ${item.sourcePath}`.toLocaleLowerCase();
  const rules: Array<[Exclude<TopicTag, "전체">, RegExp]> = [
    ["웹 보안", /http|web|api|graphql|xss|csrf|header|cookie|browser/],
    ["네트워크", /network|dns|port|packet|traffic|wireless|tls|socket|방화벽|네트워크|패킷|무선/],
    ["인증·시크릿", /auth|password|credential|secret|token|identity|mfa|비밀번호|인증|자격 증명|시크릿/],
    ["클라우드·컨테이너", /cloud|docker|kubernetes|container|serverless|aws|azure|gcp|클라우드|컨테이너/],
    ["위협 탐지", /siem|detect|threat|monitor|honeypot|alert|soc|탐지|위협|모니터|경보/],
    ["안전한 개발", /secure coding|sast|sbom|supply chain|dependency|lint|devsecops|코드|공급망|의존성/],
    ["포렌식·분석", /forensic|malware|binary|reverse|log|analysis|분석|포렌식|악성코드|로그/],
    ["개인정보", /privacy|pii|metadata|data loss|dlp|scrub|개인정보|메타데이터|민감 정보/],
  ];
  const tags = rules.filter(([, rule]) => rule.test(haystack)).map(([tag]) => tag);
  return tags.length ? tags : ["안전한 개발"];
}

export function filterLibraryItems(items: LibraryItem[], query: string, type: string, tier: string, tag: TopicTag = "전체") {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const haystack = `${item.title} ${item.originalTitle || ""} ${item.summary} ${item.originalSummary || ""} ${item.sourcePath} ${item.type} ${item.tier}`.toLocaleLowerCase();
    return (type === "전체" || item.type === type) && (tier === "전체" || item.tier === tier) && (tag === "전체" || getItemTags(item).includes(tag)) && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
}

export function getReadableTier(tier: string) {
  const tiers: Record<string, string> = { Foundations: "기초", Beginner: "입문", Intermediate: "중급", Advanced: "심화", "공통": "공통" };
  return tiers[tier] || tier;
}

export function toInternalReadingMarkdown(markdown: string) {
  const images: string[] = [];
  let neutralized = markdown.replace(/!\[([^\]]*)\]\(https?:\/\/[^)\s]+(?:\s+"[^"]*")?\)/g, (_match, label: string) => {
    images.push(label);
    return `@@IMAGE_${images.length - 1}@@`;
  });
  let previous = "";
  while (neutralized !== previous) {
    previous = neutralized;
    neutralized = neutralized.replace(/\]\([^)\n]+\)/g, "]");
  }
  return neutralized
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/@@IMAGE_(\d+)@@/g, (_match, index: string) => `[${images[Number(index)]}]`);
}
