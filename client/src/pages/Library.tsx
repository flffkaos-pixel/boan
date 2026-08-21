/**
 * TRACE//LAB Internal Library: an in-site, source-attributed reader for public project docs and code bundles.
 */
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Filter,
  Info,
  Layers3,
  ListChecks,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPracticeGuide } from "@/lib/learning-discovery";
import { filterLibraryItems, getItemTags, getReadableTier, toInternalReadingMarkdown, TOPIC_TAGS, type LibraryItem, type TopicTag } from "@/lib/library-utils";
import "../library.css";
import "../library-archive.css";
import "../library-checklist.css";
import "../library-practice-guide.css";

const MANIFEST_URL = "/fallback-manifest.json";
const SOURCE_PACKAGE_URL = "/fallback-bundle.json";

type LibraryManifest = {
  repository: string;
  license: string;
  notice: string;
  licenseText: string;
  storageNotice: string;
  bundleCount: number;
  defaultLanguage?: "ko" | "en";
  translationNotice?: string;
  items: LibraryItem[];
};

type LibraryBundle = {
  id: string;
  title: string;
  type: string;
  tier: string;
  sourcePath: string;
  summary: string;
  attribution: { repository: string; license: string; notice: string };
  translation?: { language: "ko"; originalLanguage: "en"; notice: string };
  documents: Array<{ path: string; title: string; content: string }>;
  sourceFiles: Array<{ path: string; language: string; content: string }>;
};

const EMPTY_MANIFEST: LibraryManifest = { repository: "", license: "", notice: "", licenseText: "", storageNotice: "", bundleCount: 0, items: [] };

function getInitialQuery() {
  return new URLSearchParams(window.location.search).get("query") || "";
}

function getInitialTier() {
  const tier = new URLSearchParams(window.location.search).get("tier") || "전체";
  return ["Foundations", "Beginner", "Intermediate", "Advanced"].includes(tier) ? tier : "전체";
}

function getEditorialGuide(bundle: LibraryBundle) {
  const tier = getReadableTier(bundle.tier);
  const typeCopy: Record<string, string> = {
    "프로젝트": "이 기록은 실제 도구를 만들며 방어 원리를 확인하는 프로젝트형 자료입니다.",
    "개요": "이 기록은 주제의 범위와 핵심 개념을 먼저 잡는 개요형 자료입니다.",
    "로드맵": "이 기록은 역할과 역량을 단계적으로 연결하는 경로형 자료입니다.",
    "리소스": "이 기록은 실습을 보완할 수 있는 도구·프레임워크·학습 자원형 자료입니다.",
  };
  return {
    intro: typeCopy[bundle.type] || "이 기록은 원문 자료를 TRACE//LAB 내부에서 탐색할 수 있도록 정리한 학습 자료입니다.",
    points: [
      `${tier} 단계에서 요구하는 문제 정의와 입력·출력 경계를 먼저 표시해 보세요.`,
      "구현 세부보다 방어를 위해 어떤 검증 기준이 필요한지 찾아 표시해 보세요.",
      "코드 예제를 읽기 전, 허가된 실습 환경에서 확인할 관찰 항목을 적어 보세요.",
    ],
  };
}

function parseCompletedTaskIds(value: string | undefined) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((taskId): taskId is string => typeof taskId === "string") : [];
  } catch {
    return [];
  }
}

export default function Library() {
  const [manifest, setManifest] = useState<LibraryManifest>(EMPTY_MANIFEST);
  const [selectedId, setSelectedId] = useState("");
  const [bundle, setBundle] = useState<LibraryBundle | null>(null);
  const [query, setQuery] = useState(getInitialQuery);
  const [type, setType] = useState("전체");
  const [tier, setTier] = useState(getInitialTier);
  const [topicTag, setTopicTag] = useState<TopicTag>("전체");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [tab, setTab] = useState<"learn" | "checklist" | "code" | "license">("learn");
  const [docIndex, setDocIndex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [error, setError] = useState("");
  const [localCompletedTaskIds, setLocalCompletedTaskIds] = useState<string[]>([]);
  const [activeChecklistIndex, setActiveChecklistIndex] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(MANIFEST_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("내부 학습 목록을 불러오지 못했습니다.");
        return response.json();
      })
      .then((data: LibraryManifest) => {
        setManifest(data);
        const initialQuery = getInitialQuery().toLowerCase();
        setLanguage(data.defaultLanguage || "ko");
        setSelectedId((current) => current || data.items.find((item) => `${item.title} ${item.originalTitle || ""}`.toLowerCase().includes(initialQuery))?.id || data.items[0]?.id || "");
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError("내부 학습 라이브러리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(() => filterLibraryItems(manifest.items, query, type, tier, topicTag), [manifest.items, query, type, tier, topicTag]);
  const selectedItem = manifest.items.find((item) => item.id === selectedId) || visibleItems[0] || null;

  useEffect(() => {
    if (!selectedItem) return;
    const controller = new AbortController();
    setBundle(null);
    setBundleLoading(true);
    setDocIndex(0);
    setFileIndex(0);
    setCopied(false);
    const bundleUrl = language === "ko" ? (selectedItem.koreanBundleUrl || selectedItem.bundleUrl) : (selectedItem.originalBundleUrl || selectedItem.bundleUrl);
    fetch(bundleUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("학습 자료를 열 수 없습니다.");
        return response.json();
      })
      .then((data: LibraryBundle) => setBundle(data))
      .catch((reason) => {
        if (reason.name !== "AbortError") setError("선택한 학습 자료를 열지 못했습니다.");
      })
      .finally(() => setBundleLoading(false));
    return () => controller.abort();
  }, [selectedItem?.bundleUrl, selectedItem?.koreanBundleUrl, selectedItem?.originalBundleUrl, language]);

  const types = useMemo(() => ["전체", ...Array.from(new Set(manifest.items.map((item) => item.type)))], [manifest.items]);
  const tiers = useMemo(() => ["전체", ...Array.from(new Set(manifest.items.map((item) => item.tier)))], [manifest.items]);
  const activeDoc = bundle?.documents[docIndex] || null;
  const activeFile = bundle?.sourceFiles[fileIndex] || null;
  const editorialGuide = bundle ? getEditorialGuide(bundle) : null;
  const checklistItems = useMemo(() => {
    const bundleId = bundle?.id || "pending-record";
    return (bundle?.documents || []).map((document, index) => ({ id: `${bundleId}:${document.path}:${index}`, label: document.title, path: document.path }));
  }, [bundle]);
  useEffect(() => setLocalCompletedTaskIds([]), [bundle?.id]);

  const chooseItem = (item: LibraryItem) => {
    setSelectedId(item.id);
    setTab("learn");
    window.history.replaceState(null, "", `/library?query=${encodeURIComponent(item.originalTitle || item.title)}`);
  };

  const copyActiveCode = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const toggleChecklistItem = (taskId: string) => {
    if (!bundle) return;
    const nextTaskIds = localCompletedTaskIds.includes(taskId)
      ? localCompletedTaskIds.filter((currentTaskId) => currentTaskId !== taskId)
      : [...localCompletedTaskIds, taskId];
    setLocalCompletedTaskIds(nextTaskIds);
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <div className="library-shell">
          <a href="/" className="library-brand"><span className="library-mark"><ShieldCheck size={17} /></span><span>TRACE<span>//</span>LAB</span></a>
          <div className="library-header-center"><span>INTERNAL LEARNING LIBRARY</span><i>·</i><span>{manifest.bundleCount || "…"} RECORDS</span></div>
          <div className="library-header-actions"><a href="/study" className="header-study-link">용어 퀴즈</a><a href="/" className="back-home"><ArrowLeft size={15} /> 홈으로</a></div>
        </div>
      </header>

      <main className="library-shell library-main">
        <section className="library-intro" aria-labelledby="library-title">
          <div>
            <p className="library-kicker">[ TRACE//LAB / KNOWLEDGE VAULT ]</p>
            <h1 id="library-title">코드와 문서를<br /><em>사이트 안에서</em> 읽습니다.</h1>
            <p>프로젝트, 실습 문서, 로드맵, 리소스를 TRACE//LAB 내부에서 검색하고 학습하세요. 선택한 자료의 문서와 소스 예제는 필요한 순간에만 열립니다.</p>
          </div>
          <div className="library-intro-stats" aria-label="내부 학습 라이브러리 현황">
            <div><span>ARCHIVE</span><strong>{manifest.bundleCount || "…"}</strong><p>내부 학습 기록</p></div>
            <div><span>MODE</span><strong>READ</strong><p>문서 · 코드 열람</p></div>
          </div>
        </section>

        <section className="library-workspace" aria-label="내부 학습 라이브러리">
          <aside className="library-catalog">
            <div className="catalog-label"><Layers3 size={16} /><span>CATALOG / FILTER</span></div>
            <label className="catalog-search"><Search size={16} /><span className="sr-only">내부 자료 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로젝트·개념 검색" /></label>
            <div className="catalog-selects">
              <label><Filter size={14} /><span className="sr-only">자료 유형 필터</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
              <label><BookOpen size={14} /><span className="sr-only">학습 단계 필터</span><select value={tier} onChange={(event) => setTier(event.target.value)}>{tiers.map((entry) => <option key={entry} value={entry}>{entry === "전체" ? entry : getReadableTier(entry)}</option>)}</select></label>
            </div>
            <div className="catalog-tags" aria-label="주제 키워드 태그">
              <p>KEYWORD TAGS</p>
              <div>{TOPIC_TAGS.map((tag) => <button key={tag} onClick={() => setTopicTag(tag)} className={topicTag === tag ? "is-active" : ""} aria-pressed={topicTag === tag}>{tag}</button>)}</div>
            </div>
            <p className="catalog-count" aria-live="polite"><strong>{visibleItems.length}</strong>개 자료를 찾았습니다.</p>
            <div className="catalog-list" aria-label="학습 자료 목록">
              {loading && <div className="catalog-loading"><Loader2 className="animate-spin" size={18} /> 목록을 정리하는 중입니다.</div>}
              {!loading && visibleItems.map((item, index) => (
                <button key={item.id} onClick={() => chooseItem(item)} className={`catalog-item ${selectedItem?.id === item.id ? "is-active" : ""}`} aria-pressed={selectedItem?.id === item.id}>
                  <span className="catalog-item-top"><small>REC-{String(index + 1).padStart(3, "0")}</small><small>{item.type} / {getReadableTier(item.tier)}</small></span>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                  <span className="catalog-item-meta"><i><FileText size={12} /> {item.documentCount}</i><i><FileCode2 size={12} /> {item.sourceCount}</i><em>{selectedItem?.id === item.id ? "ACTIVE" : "READY"}</em><ChevronRight size={14} /></span>
                  <span className="catalog-item-tags">{getItemTags(item).slice(0, 2).map((tag) => <small key={`${item.id}-${tag}`}>{tag}</small>)}</span>
                </button>
              ))}
              {!loading && !visibleItems.length && <div className="catalog-empty">조건에 맞는 자료가 없습니다. 검색어 또는 필터를 바꿔 보세요.</div>}
            </div>
          </aside>

          <article className="library-reader" aria-live="polite">
            {error && <div className="library-error"><strong>자료를 열지 못했습니다.</strong><p>{error}</p><button onClick={() => window.location.reload()}>다시 시도</button></div>}
            {!error && (bundleLoading || !bundle) && <div className="reader-loading"><Loader2 className="animate-spin" size={26} /><p>선택한 학습 기록을 여는 중입니다.</p></div>}
            {!error && bundle && (
              <>
                <div className="reader-heading">
                  <div><p className="library-kicker">{bundle.type.toUpperCase()} / {getReadableTier(bundle.tier)}</p><h2>{bundle.title}</h2><p className="reader-summary">{bundle.summary}</p></div>
                  <div className="reader-path"><span>RECORD STATUS</span><strong>ACTIVE<br />EVIDENCE</strong><code>{bundle.sourcePath}</code></div>
                </div>
                <div className="language-band" aria-label="문서 언어 선택">
                  <div><span>LANGUAGE / DEFAULT</span><strong>{language === "ko" ? "한국어 학습 번역" : "ENGLISH ORIGINAL"}</strong><p>{language === "ko" ? "TRACE//LAB이 학습 편의를 위해 제공하는 한국어 번역입니다. 코드·명령어·식별자·경로는 원문을 유지했습니다." : "번역 기준을 확인하기 위한 원문 영어 보기입니다."}</p></div>
                  <div className="language-switch" role="group" aria-label="문서 언어 선택 버튼">
                    <button className={language === "ko" ? "is-active" : ""} onClick={() => setLanguage("ko")} aria-pressed={language === "ko"}>한국어</button>
                    <button className={language === "en" ? "is-active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>원문 영어</button>
                  </div>
                </div>
                <div className="reader-editorial-guide">
                  <div className="editorial-stamp"><ShieldCheck size={22} /><span>TRACE//LAB<br />EDITORIAL</span></div>
                  <div><p className="guide-label">KOREAN LEARNING GUIDE / 01</p><strong>이 자료를 읽는 방법</strong><p>{editorialGuide?.intro}</p></div>
                  <ol>{editorialGuide?.points.map((point, index) => <li key={point}><span>0{index + 1}</span>{point}</li>)}</ol>
                </div>
                <div className="reader-tabs" role="tablist" aria-label="학습 자료 보기 방식">
                  <button role="tab" aria-selected={tab === "learn"} className={tab === "learn" ? "is-active" : ""} onClick={() => setTab("learn")}><BookOpen size={15} /> 학습 문서 <span>{bundle.documents.length}</span></button>
                  <button role="tab" aria-selected={tab === "checklist"} className={tab === "checklist" ? "is-active" : ""} onClick={() => setTab("checklist")}><ListChecks size={15} /> 실습 체크 <span>{localCompletedTaskIds.length}/{checklistItems.length}</span></button>
                  <button role="tab" aria-selected={tab === "code"} className={tab === "code" ? "is-active" : ""} onClick={() => setTab("code")}><Code2 size={15} /> 소스 예제 <span>{bundle.sourceFiles.length}</span></button>
                  <button role="tab" aria-selected={tab === "license"} className={tab === "license" ? "is-active" : ""} onClick={() => setTab("license")}><FileText size={15} /> 사용 고지</button>
                </div>
                {tab === "learn" && <div className="reader-content">{bundle.documents.length ? <><div className="reader-subnav">{bundle.documents.map((document, index) => <button key={`${document.path}-${index}`} onClick={() => setDocIndex(index)} className={docIndex === index ? "is-active" : ""}>{document.title}</button>)}</div><div className="reader-record-divider"><span>DOCUMENT / {String(docIndex + 1).padStart(2, "0")}</span><span>ORIGINAL LANGUAGE PRESERVED</span><i /></div><div className="markdown-reader"><ReactMarkdown remarkPlugins={[remarkGfm]}>{toInternalReadingMarkdown(activeDoc?.content || "")}</ReactMarkdown></div></> : <div className="reader-empty"><BookOpen size={25} /><p>이 항목에는 별도 학습 문서가 없습니다.</p></div>}</div>}
                {tab === "checklist" && <div className="reader-content checklist-reader"><div className="checklist-intro"><div><p className="library-kicker">[ PRACTICE CHECK ]</p><h3>프로젝트를 따라가며<br />실습 단계를 확인하세요.</h3><p>문서의 실제 학습 단계로 만든 체크리스트입니다. 체크 상태는 현재 화면에서만 표시되며, 새로고침하면 초기화됩니다.</p></div><div className="checklist-stat"><span>COMPLETED</span><strong>{localCompletedTaskIds.length}<i>/{checklistItems.length}</i></strong><p>{localCompletedTaskIds.length === checklistItems.length ? "모든 실습 단계 확인" : "다음 학습 단계 선택"}</p></div></div><ol className="checklist-steps">{checklistItems.map((item, index) => { const completed = localCompletedTaskIds.includes(item.id); return <li key={item.id} className={completed ? "is-completed" : ""}><div className="checklist-step-row"><button onClick={() => toggleChecklistItem(item.id)} aria-pressed={completed}><span>{completed ? <Check size={15} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{item.path}</small></div><i>{completed ? "완료" : "확인"}</i></button><button className="checklist-help-button" onClick={() => setActiveChecklistIndex(index)} aria-label={`${item.label} 실습 도움말 열기`}><Info size={16} /> 도움말</button></div></li>; })}</ol></div>}
                {tab === "code" && <div className="reader-content">{bundle.sourceFiles.length ? <><div className="reader-subnav code-files">{bundle.sourceFiles.map((file, index) => <button key={`${file.path}-${index}`} onClick={() => setFileIndex(index)} className={fileIndex === index ? "is-active" : ""} title={file.path}>{file.path.split("/").pop()}</button>)}</div><div className="code-toolbar"><code>{activeFile?.path}</code><button onClick={copyActiveCode}>{copied ? <><Check size={14} /> 복사됨</> : <><Clipboard size={14} /> 코드 복사</>}</button></div><pre className="code-reader"><code>{activeFile?.content}</code></pre></> : <div className="reader-empty"><Code2 size={25} /><p>이 항목은 문서형 자료입니다. 학습 문서를 먼저 읽어 보세요.</p></div>}</div>}
                {tab === "license" && <div className="reader-content license-reader"><p className="license-badge">{bundle.attribution.license}</p><h3>콘텐츠 출처와 사용 고지</h3><p>{bundle.attribution.notice}</p><p>이 자료의 한국어 번역과 TRACE//LAB 내부 열람 도구는 수정·번역된 버전임을 명시하며, 원작자의 저작권 고지와 AGPL-3.0 조건을 유지합니다. TRACE//LAB은 이 학습 라이브러리와 함께 동작하는 소스 패키지를 사이트 안에서 제공합니다.</p><a href={SOURCE_PACKAGE_URL} className="source-package-link" download><Download size={15} /> TRACE//LAB AGPL 소스 패키지 받기</a><p className="license-clarifier">원작 프로젝트·번역 콘텐츠·TRACE//LAB 인터페이스를 외부에 재배포하거나 수정하여 제공할 계획이라면, 해당 배포물의 완전한 대응 소스와 라이선스 고지를 함께 제공해야 합니다.</p><details><summary>AGPL-3.0 전문 보기</summary><pre>{manifest.licenseText}</pre></details></div>}
              </>
            )}
          </article>
        </section>

        <section className="library-safety-note"><ShieldCheck size={20} /><p><strong>실습 프로토콜.</strong> 이 자료는 방어적 보안 학습을 위한 내부 열람 자료입니다. 코드를 실행할 때에는 본인 소유 또는 명시적으로 허가받은 환경과 격리된 실습 랩을 사용하세요.</p></section>
      </main>
      {bundle && activeChecklistIndex !== null && checklistItems[activeChecklistIndex] && (() => {
        const item = checklistItems[activeChecklistIndex];
        const guide = getPracticeGuide(item.label, item.path, bundle.tier, activeChecklistIndex);
        return <Dialog open onOpenChange={(open) => !open && setActiveChecklistIndex(null)}><DialogContent className="practice-guide-dialog"><DialogHeader><p className="practice-guide-kicker">PRACTICE FIELD NOTE / {String(activeChecklistIndex + 1).padStart(2, "0")}</p><DialogTitle>{item.label}</DialogTitle><DialogDescription>{guide.objective}</DialogDescription></DialogHeader><div className="practice-guide-body"><section><h4>권장 순서</h4><ol>{guide.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol></section><section><h4>완료 확인</h4><p>{guide.verify}</p></section><section className="practice-boundary"><h4>실습 경계</h4><p>{guide.boundary}</p></section><a href={guide.reference.url} target="_blank" rel="noreferrer" className="practice-reference"><span><small>OFFICIAL REFERENCE</small><strong>{guide.reference.name}</strong><p>{guide.reference.note}</p></span><ExternalLink size={18} /></a></div></DialogContent></Dialog>;
      })()}
    </div>
  );
}
