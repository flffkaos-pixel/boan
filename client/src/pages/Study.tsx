/**
 * TRACE//LAB public review station: tiered Korean security-term quizzes with immediate feedback and no account requirement.
 */
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, CircleHelp, Layers3, RotateCcw, ShieldCheck } from "lucide-react";
import "../study.css";

type QuizTier = "Foundations" | "Beginner" | "Intermediate" | "Advanced";
type QuizItem = { tier: QuizTier; term: string; question: string; choices: string[]; answer: number; explanation: string; tag: string };

const TRACKS = [
  { label: "기초", number: "01", total: 3, name: "Foundations" as const },
  { label: "입문", number: "02", total: 41, name: "Beginner" as const },
  { label: "중급", number: "03", total: 35, name: "Intermediate" as const },
  { label: "심화", number: "04", total: 29, name: "Advanced" as const },
];

const QUIZ: QuizItem[] = [
  { tier: "Foundations", term: "CIA 트라이어드", question: "정보 보안의 기밀성·무결성·가용성을 함께 부르는 말은 무엇인가요?", choices: ["CIA 트라이어드", "제로 트러스트", "침해 지표", "데이터 분류"], answer: 0, explanation: "CIA 트라이어드는 정보 보호 목표를 기밀성, 무결성, 가용성으로 정리한 기본 모델입니다.", tag: "안전한 개발" },
  { tier: "Foundations", term: "최소 권한", question: "업무에 꼭 필요한 권한만 계정에 주는 원칙은 무엇인가요?", choices: ["심층 방어", "최소 권한", "데이터 최소화", "위협 모델링"], answer: 1, explanation: "최소 권한은 권한 남용과 침해 확산 범위를 줄이는 기본 통제입니다.", tag: "인증·시크릿" },
  { tier: "Foundations", term: "MFA", question: "비밀번호 외의 추가 인증 요소로 계정 탈취 위험을 줄이는 방식은 무엇인가요?", choices: ["MFA", "TLS", "NAT", "CVE"], answer: 0, explanation: "MFA는 비밀번호가 유출되어도 추가 인증 요소로 계정 보호를 강화합니다.", tag: "인증·시크릿" },
  { tier: "Foundations", term: "해시", question: "입력 데이터를 고정 길이의 값으로 변환하며 일반적으로 원래 입력을 복원하지 않는 함수는 무엇인가요?", choices: ["인코딩", "해시", "압축", "직렬화"], answer: 1, explanation: "해시는 무결성 확인과 비밀번호 저장 설계에서 중요하지만, 비밀번호는 적절한 솔트·반복 처리와 함께 다뤄야 합니다.", tag: "안전한 개발" },
  { tier: "Foundations", term: "로그", question: "시스템에서 발생한 행동과 상태 변화를 시간순으로 남긴 기록은 무엇인가요?", choices: ["로그", "페이로드", "토큰", "익스플로잇"], answer: 0, explanation: "로그는 탐지·조사·복구 판단의 핵심 증거가 됩니다.", tag: "포렌식·분석" },
  { tier: "Foundations", term: "HSTS", question: "브라우저가 지정한 기간 동안 HTTPS만 사용하도록 지시하는 보안 헤더는 무엇인가요?", choices: ["CSP", "HSTS", "X-Frame-Options", "Referrer-Policy"], answer: 1, explanation: "HSTS는 HTTP로의 다운그레이드를 줄이고 HTTPS 사용을 강제합니다.", tag: "웹 보안" },
  { tier: "Beginner", term: "DNS", question: "도메인 이름을 IP 주소 같은 네트워크 정보로 연결하는 시스템은 무엇인가요?", choices: ["DNS", "SIEM", "SBOM", "MFA"], answer: 0, explanation: "DNS는 네트워크 통신의 기본 요소이며, 레코드 구성과 변경 이력은 보안 점검 대상입니다.", tag: "네트워크" },
  { tier: "Beginner", term: "CVE", question: "공개적으로 식별된 취약점에 부여하는 표준 식별자는 무엇인가요?", choices: ["CVE", "CSP", "TLS", "JWT"], answer: 0, explanation: "CVE는 취약점 정보를 공통 식별자로 추적하고 대응 우선순위를 정하는 데 사용됩니다.", tag: "위협 탐지" },
  { tier: "Beginner", term: "시크릿 스캐닝", question: "소스 코드나 커밋 기록에서 API 키·토큰 같은 민감 정보를 찾는 활동은 무엇인가요?", choices: ["퍼징", "시크릿 스캐닝", "패킷 캡처", "포트 스캐닝"], answer: 1, explanation: "시크릿 스캐닝은 노출된 자격 증명을 조기에 찾아 폐기·교체하는 데 도움을 줍니다.", tag: "인증·시크릿" },
  { tier: "Beginner", term: "CIS 벤치마크", question: "운영체제와 서비스의 보안 설정을 점검할 때 참고하는 권고 기준 모음은 무엇인가요?", choices: ["CIS 벤치마크", "DNS 존", "패킷 필터", "위협 피드"], answer: 0, explanation: "CIS 벤치마크는 안전한 구성 기준을 비교·점검할 때 활용됩니다.", tag: "안전한 개발" },
  { tier: "Beginner", term: "방화벽 허용 목록", question: "필요한 통신만 명시적으로 허용하는 방화벽 접근 방식은 무엇인가요?", choices: ["허용 목록", "모든 포트 개방", "기본 허용", "신호 암호화"], answer: 0, explanation: "기본 거부와 허용 목록 접근은 불필요한 노출 면을 줄이는 데 유용합니다.", tag: "네트워크" },
  { tier: "Beginner", term: "메타데이터", question: "파일 내용 외에 생성자·위치·생성 시각처럼 함께 기록될 수 있는 부가 정보는 무엇인가요?", choices: ["메타데이터", "솔트", "세션", "해시"], answer: 0, explanation: "메타데이터는 개인정보나 운영 정보를 노출할 수 있어 공유 전 점검이 필요합니다.", tag: "개인정보" },
  { tier: "Intermediate", term: "SIEM", question: "여러 시스템의 로그를 수집·상관 분석해 탐지와 대응을 돕는 플랫폼은 무엇인가요?", choices: ["SIEM", "DNS", "MFA", "CDN"], answer: 0, explanation: "SIEM은 보안 이벤트를 한곳에서 분석하고 경보를 관리하는 데 사용합니다.", tag: "위협 탐지" },
  { tier: "Intermediate", term: "SBOM", question: "소프트웨어를 구성하는 컴포넌트와 의존성을 목록화한 문서는 무엇인가요?", choices: ["SBOM", "SOC", "SAST", "CVE"], answer: 0, explanation: "SBOM은 취약한 의존성의 영향 범위를 파악하고 공급망 위험을 관리하는 데 유용합니다.", tag: "안전한 개발" },
  { tier: "Intermediate", term: "레이트 리미팅", question: "짧은 시간에 과도하게 들어오는 요청을 제한하는 통제는 무엇인가요?", choices: ["레이트 리미팅", "정적 분석", "데이터 마스킹", "키 회전"], answer: 0, explanation: "레이트 리미팅은 서비스 남용과 일부 자동화 공격의 영향을 줄이는 방어 수단입니다.", tag: "웹 보안" },
  { tier: "Intermediate", term: "컨테이너 최소 권한", question: "컨테이너를 운영할 때 불필요한 특권 모드와 과도한 권한을 피하는 원칙은 무엇과 가장 가깝나요?", choices: ["최소 권한", "무제한 접근", "기본 관리자", "평문 시크릿"], answer: 0, explanation: "컨테이너도 필요한 권한만 주고 이미지·런타임 설정을 점검해야 합니다.", tag: "클라우드·컨테이너" },
  { tier: "Intermediate", term: "DLP", question: "민감 정보가 조직 밖으로 유출되는 것을 탐지·통제하는 체계는 무엇인가요?", choices: ["DLP", "NAT", "TLS", "SFTP"], answer: 0, explanation: "DLP는 데이터 유형과 흐름을 기준으로 정책 위반을 탐지하는 데 활용됩니다.", tag: "개인정보" },
  { tier: "Intermediate", term: "TLS 핑거프린팅", question: "TLS 핸드셰이크 특성을 조합해 통신 클라이언트를 분류하는 기법은 무엇인가요?", choices: ["TLS 핑거프린팅", "포트 포워딩", "비밀번호 솔팅", "데이터 압축"], answer: 0, explanation: "TLS 핑거프린팅은 네트워크 가시성을 높이지만 단독 판단이 아니라 다른 신호와 함께 해석해야 합니다.", tag: "네트워크" },
  { tier: "Advanced", term: "제로 트러스트", question: "네트워크 위치만으로 신뢰하지 않고 매 접근 요청을 검증하는 접근 모델은 무엇인가요?", choices: ["제로 트러스트", "기본 신뢰", "단일 경계", "공유 계정"], answer: 0, explanation: "제로 트러스트는 명시적 검증과 최소 권한, 침해 가정을 바탕으로 접근을 설계합니다.", tag: "인증·시크릿" },
  { tier: "Advanced", term: "위협 모델링", question: "설계 단계에서 자산·공격 경로·통제를 구조적으로 검토하는 활동은 무엇인가요?", choices: ["위협 모델링", "로그 삭제", "패킷 암호화", "포트 개방"], answer: 0, explanation: "위협 모델링은 구현 전에 위험을 발견하고 우선순위를 정하는 데 도움을 줍니다.", tag: "안전한 개발" },
  { tier: "Advanced", term: "위협 인텔리전스", question: "위협 행위자·전술·침해 지표를 수집·분석해 방어 의사결정에 쓰는 정보는 무엇인가요?", choices: ["위협 인텔리전스", "캐시", "데이터 압축", "버전 관리"], answer: 0, explanation: "위협 인텔리전스는 맥락과 신뢰도를 함께 평가할 때 방어 우선순위에 도움이 됩니다.", tag: "위협 탐지" },
  { tier: "Advanced", term: "사고 대응 플레이북", question: "경보가 발생했을 때 역할·조치·증거 보존 순서를 미리 정리한 문서는 무엇인가요?", choices: ["사고 대응 플레이북", "사용자 가이드", "코드 스타일", "비밀번호 목록"], answer: 0, explanation: "플레이북은 긴급 상황에서도 일관된 조사와 복구 절차를 수행하도록 돕습니다.", tag: "위협 탐지" },
  { tier: "Advanced", term: "심층 방어", question: "하나의 통제 실패에 대비해 여러 계층의 방어를 조합하는 전략은 무엇인가요?", choices: ["심층 방어", "단일 통제", "기본 허용", "평문 전송"], answer: 0, explanation: "심층 방어는 예방·탐지·대응 통제를 함께 설계해 단일 실패 지점을 줄입니다.", tag: "안전한 개발" },
  { tier: "Advanced", term: "Secure by Design", question: "보안을 출시 후 추가 기능이 아니라 제품 설계의 핵심 요구사항으로 다루는 원칙은 무엇인가요?", choices: ["Secure by Design", "Security by Obscurity", "기본 비활성화", "사후 검토"], answer: 0, explanation: "Secure by Design은 설계·개발 단계부터 취약점 가능성을 줄이는 접근입니다.", tag: "안전한 개발" },
];

export default function Study() {
  const [selectedTier, setSelectedTier] = useState<QuizTier>("Foundations");
  const selectedTrack = TRACKS.find((track) => track.name === selectedTier)!;
  const questions = useMemo(() => QUIZ.filter((item) => item.tier === selectedTier), [selectedTier]);
  const [answers, setAnswers] = useState<number[]>(Array(6).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(() => answers.reduce((sum, answer, index) => sum + (answer === questions[index]?.answer ? 1 : 0), 0), [answers, questions]);
  const chooseTier = (tier: QuizTier) => { setSelectedTier(tier); setAnswers(Array(QUIZ.filter((item) => item.tier === tier).length).fill(-1)); setSubmitted(false); };
  const resetQuiz = () => { setAnswers(Array(questions.length).fill(-1)); setSubmitted(false); };

  return (
    <div className="review-page">
      <header className="review-header"><a href="/" className="review-brand"><ShieldCheck size={17} /> TRACE<span>//</span>LAB</a><p>PUBLIC REVIEW STATION · KOREAN SECURITY TERMS</p><a href="/library" className="review-back">학습실로 <ChevronRight size={15} /></a></header>
      <main className="study-page">
        <section className="study-heading review-heading"><div><p className="study-kicker">[ TRACE//LAB / QUICK REVIEW ]</p><h1>배운 용어를<br /><em>바로 확인하세요.</em></h1><p>기초부터 심화까지 방어 중심 개념을 단계별 6문항으로 복습합니다. 점수는 이 브라우저 화면에서만 확인하며 계정에 저장하지 않습니다.</p></div><div className="study-status-stamp"><span>QUIZ SET</span><strong>{String(questions.length).padStart(2, "0")}</strong><p>{selectedTrack.label} 보안 용어</p><i>NO LOGIN<br />REQUIRED</i></div></section>
        <section className="track-progress-panel review-track-panel" aria-labelledby="track-title"><div className="panel-title"><div><p className="study-kicker">[ CONTENT STRUCTURE ]</p><h2 id="track-title">125개 자료, 4개의 방어 단계.</h2></div><a href="/library">전체 아카이브 열기 <ChevronRight size={15} /></a></div><div className="track-progress-list">{TRACKS.map((track) => <article key={track.name} className="track-progress-card"><div><span>{track.number}</span><strong>{track.label}</strong><small>{track.name}</small></div><p><b>{track.total}</b>개 프로젝트</p><div className="progress-rule"><i /></div><a href={`/library?tier=${track.name}`}>이 단계 열기 <ChevronRight size={14} /></a></article>)}</div><p className="common-record-note"><Layers3 size={15} /> 공통 개요·로드맵·리소스 <strong>17개</strong>는 모든 단계에서 참고할 수 있습니다.</p></section>
        <section className="quiz-panel" aria-labelledby="quiz-title"><div className="quiz-panel-heading"><div><p className="study-kicker">[ KOREAN SECURITY TERM REVIEW ]</p><h2 id="quiz-title">난이도를 골라, 용어를 확인하세요.</h2><p>단계를 선택한 뒤 정답과 해설을 통해 프로젝트 주제와 다시 연결해 보세요.</p></div><CircleHelp size={32} /></div><div className="quiz-level-switch" role="group" aria-label="퀴즈 난이도 선택">{TRACKS.map((track) => <button key={track.name} onClick={() => chooseTier(track.name)} className={selectedTier === track.name ? "is-active" : ""} aria-pressed={selectedTier === track.name}><span>{track.number}</span><strong>{track.label}</strong><small>{track.name} · 6문항</small></button>)}</div><div className="quiz-grid">{questions.map((item, index) => <article key={`${item.tier}-${item.term}`} className={`quiz-question ${submitted ? (answers[index] === item.answer ? "is-correct" : "is-wrong") : ""}`}><p><span>Q{String(index + 1).padStart(2, "0")}</span>{item.term}<em>{item.tag}</em></p><h3>{item.question}</h3><div>{item.choices.map((choice, choiceIndex) => <button key={choice} onClick={() => !submitted && setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? choiceIndex : answer))} className={answers[index] === choiceIndex ? "is-selected" : ""} disabled={submitted}><i>{String.fromCharCode(65 + choiceIndex)}</i>{choice}</button>)}</div>{submitted && <small><CheckCircle2 size={14} /> {item.explanation}</small>}</article>)}</div><div className="quiz-submit-row"><p>{submitted ? <><strong>{selectedTrack.label} {score} / {questions.length}점</strong> — 해설을 읽고 관련 프로젝트 주제를 다시 찾아보세요.</> : `${selectedTrack.label} 단계의 모든 문항을 고르면 즉시 정답과 해설을 확인할 수 있습니다.`}</p>{submitted ? <button onClick={resetQuiz}><RotateCcw size={14} /> 다시 풀기</button> : <button onClick={() => setSubmitted(true)} disabled={answers.some((answer) => answer < 0)}>정답 확인</button>}</div></section>
      </main>
    </div>
  );
}
