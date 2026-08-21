/**
 * TRACE//LAB — Signal Archive page: Swiss editorial hierarchy, evidence-paper warmth,
 * ink navy structure, and signal-orange actions guide learners through real projects.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import "../ux-audit.css";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  ChevronRight,
  CircleCheck,
  Code2,
  Compass,
  FileText,
  Menu,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";

type Track = "Foundations" | "Beginner" | "Intermediate" | "Advanced";
type Filter = "전체" | Track;

const ASSETS = {
  hero: "/manus-storage/dboan-hero-signal-archive_1ef0f122.png",
  project: "/manus-storage/dboan-project-headers_f8a74e56.png",
  roadmap: "/manus-storage/dboan-roadmap-station_6a1fc10b.png",
};

const projects: Array<{
  title: string;
  track: Track;
  time: string;
  language: string;
  description: string;
  skills: string[];
  href: string;
  icon: typeof Terminal;
}> = [
  {
    title: "Hash Identifier",
    track: "Foundations",
    time: "2–4시간",
    language: "Python",
    description: "해시의 길이·접두사·문자 구성을 읽어 암호화 흔적을 분류합니다.",
    skills: ["해시 패밀리", "패턴 매칭", "PHC 형식"],
    href: "/library?query=Hash%20Identifier",
    icon: Braces,
  },
  {
    title: "HTTP Headers Scanner",
    track: "Foundations",
    time: "3–5시간",
    language: "Python",
    description: "CSP·HSTS·X-Frame-Options를 점검하며 웹 방어의 기준선을 만듭니다.",
    skills: ["HTTP", "보안 헤더", "점수형 감사"],
    href: "/library?query=HTTP%20Headers%20Scanner",
    icon: Search,
  },
  {
    title: "Password Manager",
    track: "Foundations",
    time: "6–8시간",
    language: "Python",
    description: "마스터 암호와 암호화 저장소를 설계하며 비밀 관리의 경계를 이해합니다.",
    skills: ["Argon2id", "AES-GCM", "안전한 저장"],
    href: "/library?query=Password%20Manager",
    icon: ShieldCheck,
  },
  {
    title: "DNS Lookup CLI Tool",
    track: "Beginner",
    time: "2–3시간",
    language: "Python",
    description: "도메인 레코드와 WHOIS 흐름을 따라 네트워크의 이름 체계를 관찰합니다.",
    skills: ["DNS", "WHOIS", "역방향 조회"],
    href: "/library?query=DNS%20Lookup",
    icon: Network,
  },
  {
    title: "Linux CIS Hardening Auditor",
    track: "Beginner",
    time: "6–8시간",
    language: "Bash",
    description: "CIS 벤치마크를 기준으로 시스템 설정을 점검하고 개선 지점을 기록합니다.",
    skills: ["CIS", "하드닝", "컴플라이언스"],
    href: "/library?query=Linux%20CIS%20Hardening",
    icon: Terminal,
  },
  {
    title: "Secrets Scanner",
    track: "Intermediate",
    time: "1–2일",
    language: "Go",
    description: "코드와 Git 기록에서 노출된 비밀을 찾아 개발 보안의 실제 흐름을 익힙니다.",
    skills: ["시크릿 탐지", "엔트로피", "SARIF"],
    href: "/library?query=Secrets%20Scanner",
    icon: Radar,
  },
  {
    title: "Docker Security Audit",
    track: "Intermediate",
    time: "1–2일",
    language: "Go",
    description: "컨테이너 설정을 CIS Docker Benchmark 관점에서 읽고 안전하게 해석합니다.",
    skills: ["컨테이너", "CIS", "감사 자동화"],
    href: "/library?query=Docker%20Security%20Audit",
    icon: Code2,
  },
  {
    title: "Cloud Security Compliance",
    track: "Advanced",
    time: "2–3주",
    language: "Go · React",
    description: "멀티 클라우드의 보안 기준과 구성 드리프트를 다루는 운영 감각을 확장합니다.",
    skills: ["CIS", "SOC 2", "구성 드리프트"],
    href: "/library?query=Cloud%20Security%20Compliance",
    icon: Compass,
  },
];

const trackMeta: Record<Track, { label: string; number: string; count: number; className: string }> = {
  Foundations: { label: "기초", number: "01", count: 3, className: "track-foundations" },
  Beginner: { label: "입문", number: "02", count: 41, className: "track-beginner" },
  Intermediate: { label: "중급", number: "03", count: 35, className: "track-intermediate" },
  Advanced: { label: "심화", number: "04", count: 29, className: "track-advanced" },
};

const roadmapItems = [
  {
    number: "01",
    title: "보안의 언어를 익히기",
    text: "웹과 네트워크의 기본 흐름을 먼저 관찰합니다. 명령어를 외우기보다 요청과 응답의 흔적을 읽는 데 집중합니다.",
    tags: ["HTTP", "DNS", "암호 기초"],
  },
  {
    number: "02",
    title: "방어 도구 직접 만들기",
    text: "점검·감사·분석 도구를 만들어 보며 보안 기준이 코드에서 어떻게 작동하는지 확인합니다.",
    tags: ["보안 헤더", "CIS", "시크릿 관리"],
  },
  {
    number: "03",
    title: "운영 맥락으로 확장하기",
    text: "로그, 컨테이너, API, 클라우드 환경을 함께 다루며 탐지와 예방을 하나의 흐름으로 연결합니다.",
    tags: ["SIEM", "Docker", "클라우드"],
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [filter, setFilter] = useState<Filter>("전체");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState(0);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const visibleProjects = useMemo(
    () => (filter === "전체" ? projects : projects.filter((project) => project.track === filter)),
    [filter],
  );

  const navigate = (target: string) => {
    setMenuOpen(false);
    window.setTimeout(() => scrollToId(target), 0);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const firstControl = mobileMenuRef.current?.querySelector<HTMLElement>("button, a");
    window.requestAnimationFrame(() => firstControl?.focus());

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        window.setTimeout(() => mobileMenuTriggerRef.current?.focus(), 0);
      }
    };

    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [menuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f2e8] text-[#142033]">
      <div className="top-signal-bar">
        <div className="shell flex items-center justify-between gap-4">
          <p><span className="status-dot" /> LEARNING SYSTEM / ONLINE</p>
          <p className="hidden sm:block">AUTHORIZED PRACTICE ONLY · 2026</p>
        </div>
      </div>

      <header className="site-header">
        <div className="shell flex items-center justify-between gap-6">
          <button className="brand-lockup" onClick={() => scrollToId("top")} aria-label="TRACE//LAB 처음으로 이동">
            <span className="brand-mark brand-shield"><ShieldCheck size={20} /></span>
            <span className="brand-wordmark">TRACE<span>//</span>LAB</span>
          </button>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="주요 탐색">
            <button onClick={() => navigate("projects")} className="nav-link">실습 프로젝트</button>
            <button onClick={() => navigate("roadmap")} className="nav-link">학습 로드맵</button>
            <a href="/study" className="nav-link">용어 퀴즈</a>
            <button onClick={() => navigate("ethics")} className="nav-link">학습 원칙</button>
            <a href="/library" className="nav-link inline-flex items-center gap-1.5">
              내부 학습실 <ArrowDownRight size={13} />
            </a>
          </nav>

          <button ref={mobileMenuTriggerRef} className="mobile-menu-button lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={menuOpen} aria-controls="mobile-primary-nav">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav ref={mobileMenuRef} id="mobile-primary-nav" className="mobile-nav lg:hidden" aria-label="모바일 탐색">
            <button onClick={() => navigate("projects")}>실습 프로젝트 <ChevronRight size={17} /></button>
            <button onClick={() => navigate("roadmap")}>학습 로드맵 <ChevronRight size={17} /></button>
            <a href="/study">용어 퀴즈 <ArrowDownRight size={16} /></a>
            <button onClick={() => navigate("ethics")}>학습 원칙 <ChevronRight size={17} /></button>
            <a href="/library">내부 학습실 <ArrowDownRight size={16} /></a>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero-section">
          <img src={ASSETS.hero} alt="보안 분석 기록과 네트워크 도식이 놓인 포렌식 연구 데스크" className="hero-image" />
          <div className="hero-overlay" />
          <div className="shell hero-content">
            <div className="hero-index reveal" style={{ "--delay": "0ms" } as React.CSSProperties}>
              <span className="line" />
              <span>SECURITY LEARNING ARCHIVE</span>
              <span className="hero-index-number">01</span>
            </div>
            <div className="hero-copy reveal" style={{ "--delay": "80ms" } as React.CSSProperties}>
              <p className="eyebrow-light">보안을 배우는 가장 확실한 방법</p>
              <h1>읽고 이해한 뒤,<br /><em>직접</em> 방어해 보세요.</h1>
              <p className="hero-description">TRACE//LAB은 실제 보안 프로젝트를 따라 만들며, 네트워크와 시스템의 흔적을 읽는 힘을 기르는 학습 기록실입니다.</p>
              <div className="hero-actions">
                <button className="button-signal" onClick={() => scrollToId("projects")}>
                  첫 실습 열기 <ArrowDownRight size={18} />
                </button>
                <button className="button-ghost" onClick={() => scrollToId("roadmap")}>
                  나의 시작점 찾기
                </button>
                <a href="/study" className="hero-text-link">용어 퀴즈 <ArrowDownRight size={15} /></a>
              </div>
            </div>
            <aside className="hero-proof reveal" style={{ "--delay": "160ms" } as React.CSSProperties} aria-label="학습 현황">
              <div><span>REFERENCE</span><strong>70<span>+</span></strong><p>프로젝트 아이디어</p></div>
              <div><span>TRACKS</span><strong>04</strong><p>기초부터 심화까지</p></div>
              <div className="proof-source"><BookOpen size={15} /><a href="/library">INTERNAL<br />LEARNING LIBRARY</a></div>
            </aside>
          </div>
          <div className="hero-bottom-line"><div className="shell"><span>SCROLL TO EXAMINE</span><ArrowDownRight size={16} /></div></div>
        </section>

        <section className="signal-intro" aria-labelledby="intro-title">
          <div className="shell intro-layout">
            <p className="section-marker">[ TRACE//LAB / 00 ]</p>
            <div>
              <p className="eyebrow">어디서부터 시작할지 막막하다면</p>
              <h2 id="intro-title">도구 하나를 완성할 때마다,<br />방어 감각이 쌓입니다.</h2>
            </div>
            <p className="intro-copy">참조 저장소의 프로젝트를 학습 난이도와 방어 역량의 흐름으로 다시 정리했습니다. 설명을 읽고, 안전한 환경에서 코드를 살피고, 작은 결과물을 남겨 보세요.</p>
          </div>
        </section>

        <section id="projects" className="projects-section scroll-mt-24" aria-labelledby="projects-title">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="section-marker">[ PROJECT INDEX / 01 ]</p>
                <h2 id="projects-title">오늘의 실습을 고르세요.</h2>
              </div>
              <p className="section-side-note">핵심 프로젝트 8개를 먼저 보여 드립니다. 전체 125개 자료는 단계별로 내부 학습실에서 탐색할 수 있습니다.</p>
            </div>

            <div className="track-rail" aria-label="학습 단계 안내">
              {(Object.keys(trackMeta) as Track[]).map((track) => {
                const meta = trackMeta[track];
                return <div key={track} className={`track-stop ${meta.className}`}><span>{meta.number}</span><strong>{meta.label}</strong><small>{track}</small><em>{meta.count}개 프로젝트</em></div>;
              })}
            </div>

            <div className="filter-row" aria-label="프로젝트 난이도 필터">
              {(["전체", "Foundations", "Beginner", "Intermediate", "Advanced"] as Filter[]).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`filter-button ${filter === item ? "is-active" : ""}`} aria-pressed={filter === item}>
                  {item === "전체" ? "모든 트랙" : `${trackMeta[item].number} · ${trackMeta[item].label}`}
                </button>
              ))}
              <span className="filter-count" aria-live="polite">{visibleProjects.length}개의 기록</span>
            </div>

            <div className="project-grid">
              {visibleProjects.map((project, index) => {
                const Icon = project.icon;
                const meta = trackMeta[project.track];
                return (
                  <article key={project.title} className={`project-card ${index === 0 ? "project-card-featured" : ""}`}>
                    {index === 0 && <img src={ASSETS.project} alt="투명한 네트워크 분석 자료가 겹쳐진 추상 이미지" className="project-card-image" loading="lazy" decoding="async" />}
                    <div className="project-card-top">
                      <span className={`track-chip ${meta.className}`}>{meta.number} / {meta.label}</span>
                      <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                    </div>
                    <div className="project-card-main">
                      <div className="project-meta"><span>{project.time}</span><span>{project.language}</span></div>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                    </div>
                    <div className="project-card-bottom">
                      <div className="skill-list">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                      <a href={project.href} className="card-action" aria-label={`${project.title} 내부 학습 자료 열기`}>
                        <span>내부 학습 열기</span><ArrowDownRight size={17} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="full-archive-callout"><div><span>FULL ARCHIVE / 125</span><strong>공통 개요·로드맵·리소스 17개까지<br />모든 학습 기록을 단계별로 찾아보세요.</strong></div><a href="/library">전체 학습 자료 열기 <ArrowDownRight size={17} /></a></div>
          </div>
        </section>

        <section id="roadmap" className="roadmap-section scroll-mt-24" aria-labelledby="roadmap-title">
          <div className="shell roadmap-grid">
            <div className="roadmap-image-wrap">
              <img src={ASSETS.roadmap} alt="단계별 보안 학습 경로를 닮은 카드와 주황색 연결선" className="roadmap-image" loading="lazy" decoding="async" />
              <div className="roadmap-stamp"><span>STUDY</span><strong>PATH</strong><i>2026</i></div>
            </div>
            <div className="roadmap-panel">
              <p className="section-marker">[ LEARNING PATH / 02 ]</p>
              <h2 id="roadmap-title">당신의 첫 기록은<br /><em>{roadmapItems[activeRoadmap].title}</em>입니다.</h2>
              <div className="roadmap-list">
                {roadmapItems.map((item, index) => (
                  <button key={item.number} className={`roadmap-item ${activeRoadmap === index ? "is-selected" : ""}`} onClick={() => setActiveRoadmap(index)} aria-pressed={activeRoadmap === index}>
                    <span>{item.number}</span><strong>{item.title}</strong><ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <div className="roadmap-detail">
                <p>{roadmapItems[activeRoadmap].text}</p>
                <div>{roadmapItems[activeRoadmap].tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              </div>
              <button className="text-action" onClick={() => { setFilter(activeRoadmap === 0 ? "Foundations" : activeRoadmap === 1 ? "Beginner" : "Intermediate"); scrollToId("projects"); }}>
                해당 트랙으로 보기 <ArrowDownRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section id="ethics" className="ethics-section scroll-mt-24" aria-labelledby="ethics-title">
          <div className="shell">
            <div className="ethics-banner">
              <div className="ethics-symbol"><ShieldCheck size={30} /></div>
              <div className="ethics-heading"><p className="section-marker">[ PRACTICE PROTOCOL / 03 ]</p><h2 id="ethics-title">보안 학습은 허가된 환경에서만.</h2></div>
              <div className="ethics-copy"><p>TRACE//LAB은 방어 역량과 안전한 개발 습관을 위한 학습 공간입니다. 본인 소유의 시스템, 명시적으로 허가받은 실습 환경, 또는 안전하게 격리된 랩에서만 프로젝트를 실행하세요.</p><a href="/library">내부 자료실 열기 <ArrowDownRight size={14} /></a></div>
            </div>
            <div className="principle-grid">
              <article><CircleCheck size={18} /><h3>관찰부터 시작</h3><p>한 줄의 결과에도 어떤 요청과 응답이 있었는지 기록합니다.</p></article>
              <article><BookOpen size={18} /><h3>문서를 함께 읽기</h3><p>실행 전 README와 학습 문서로 위험과 목적을 확인합니다.</p></article>
              <article><FileText size={18} /><h3>나만의 흔적 남기기</h3><p>완성한 도구·막힌 지점·배운 원리를 짧게 정리해 둡니다.</p></article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div><div className="footer-brand"><ShieldCheck size={20} /><span>TRACE<span>//</span>LAB</span></div><p>프로젝트를 통해 배우는<br />한국어 보안 학습 기록실.</p></div>
          <div className="footer-reference"><p>INTERNAL ARCHIVE</p><a href="/library">프로젝트·문서·코드 예제 자료실 <ArrowDownRight size={14} /></a><small>공개 저장소의 프로젝트 분류와 콘텐츠를 TRACE//LAB 내부 학습 형식으로 구성했습니다.</small></div>
          <div className="footer-meta"><p>© 2026 TRACE//LAB</p><span>LEARN · BUILD · DEFEND</span></div>
        </div>
      </footer>
    </div>
  );
}
