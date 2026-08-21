/**
 * TRACE//LAB learning guidance: Korean practice cues and vetted public references for defensive study.
 */
export type PracticeGuide = {
  objective: string;
  steps: string[];
  verify: string;
  boundary: string;
  reference: { name: string; url: string; note: string };
};

const REFERENCES = {
  owasp: { name: "OWASP Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/", note: "구현 전·후에 확인할 수 있는 주제별 보안 실무 가이드입니다." },
  nist: { name: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework", note: "보안 활동을 위험 관리 관점에서 연결하는 공식 프레임워크입니다." },
  cisa: { name: "CISA Secure by Design", url: "https://www.cisa.gov/securebydesign", note: "설계 단계부터 보안을 기본 요구사항으로 다루는 공식 지침입니다." },
} as const;

export function getPracticeGuide(label: string, path: string, tier: string, index: number): PracticeGuide {
  const source = `${label} ${path}`.toLocaleLowerCase();
  const reference = /architecture|design|설계|구성|overview|개요|roadmap|로드맵/.test(source)
    ? REFERENCES.cisa
    : /risk|위험|threat|위협|framework|프레임워크|policy|정책/.test(source)
      ? REFERENCES.nist
      : REFERENCES.owasp;
  const stage = { Foundations: "기초", Beginner: "입문", Intermediate: "중급", Advanced: "심화" }[tier] || "현재";
  return {
    objective: `「${label}」에서 다루는 핵심 입력·출력과 방어 목적을 ${stage} 단계의 언어로 한 문장으로 정리합니다.`,
    steps: [
      `문서의 목표와 산출물을 먼저 읽고, 이번 단계에서 확인할 보안 관찰 항목 ${index + 1}개를 메모합니다.`,
      "코드나 명령을 실행하기 전, 대상·권한·격리 여부를 확인하고 자신의 실습 환경에서만 재현합니다.",
      "결과를 단순 성공·실패가 아니라 탐지 신호, 로그, 설정 변화와 연결해 검토합니다.",
    ],
    verify: "어떤 위험을 줄였는지, 어떤 증거로 확인했는지, 다음에 보완할 통제가 무엇인지 설명할 수 있으면 완료입니다.",
    boundary: "본인 소유 또는 명시적으로 허가받은 시스템과 격리된 랩에서만 실습하세요. 실제 서비스나 타인의 시스템을 대상으로 실행하지 않습니다.",
    reference,
  };
}
