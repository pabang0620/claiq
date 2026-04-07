import { Link } from 'react-router-dom'

const sections = [
  {
    id: 1,
    title: '제1조 개인정보의 처리 목적',
    content: null,
    list: [
      'CLAIQ(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다.',
      '회원 가입 및 관리: 회원제 서비스 이용에 따른 본인 확인, 개인 식별, 가입 의사 확인, 불량회원 부정 이용 방지',
      '서비스 제공: AI 기반 학습 콘텐츠 제공, 학습 이력 관리, 맞춤형 학습 경로 추천, 질문·답변 서비스 운영',
      '서비스 개선: 서비스 이용 통계 분석, 신규 서비스 개발, 기존 서비스 개선',
      '고충 처리: 민원 접수, 처리 결과 통보',
    ],
  },
  {
    id: 2,
    title: '제2조 처리하는 개인정보 항목',
    content: null,
    list: [
      '[필수 항목]',
      '이름(실명 또는 닉네임), 이메일 주소, 비밀번호(암호화 저장)',
      '전화번호(본인 확인 목적)',
      '소속 학원명, 역할(교강사·수강생·운영자)',
      '[자동 수집 항목]',
      '서비스 이용 기록(접속 일시, 이용 기능, 학습 이력)',
      'IP 주소, 브라우저 종류 및 버전, 운영체제 정보',
      '쿠키 및 로컬 스토리지 데이터(세션 유지 목적)',
    ],
  },
  {
    id: 3,
    title: '제3조 개인정보의 처리 및 보유기간',
    content: null,
    list: [
      '회원 정보: 회원 탈퇴 시까지 보유. 탈퇴 후 즉시 파기(단, 아래 법령에 따른 예외 적용)',
      '전자상거래법: 계약·청약 철회 기록 5년, 대금 결제·재화 공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년',
      '통신비밀보호법: 서비스 이용 로그 3개월',
      '부정 이용 방지: 탈퇴 후 6개월간 이메일 주소 보관(재가입 악용 방지)',
    ],
  },
  {
    id: 4,
    title: '제4조 개인정보의 제3자 제공',
    content: '서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.',
    list: [
      '이용자가 사전에 동의한 경우',
      '법령의 규정에 의한 경우 또는 수사 기관의 요청이 있는 경우',
      '서비스 제공에 관한 계약 이행을 위해 불가피한 경우로서 이용자에게 개별 동의를 받은 경우',
    ],
  },
  {
    id: 5,
    title: '제5조 개인정보 처리 위탁',
    content: '서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 외부에 위탁합니다.',
    list: [
      'OpenAI, L.L.C (미국): AI 모델을 활용한 학습 콘텐츠 생성 및 질의응답 분석. 위탁 데이터: 학습 질문, 답안 텍스트. 보유 기간: 처리 완료 즉시 파기(OpenAI 데이터 처리 정책 준수)',
      'Supabase, Inc. (미국): 데이터베이스 저장 및 인증 서비스. 위탁 데이터: 회원 정보 전반. 보유 기간: 서비스 이용 기간 및 법령 보존 기간',
      '위탁 계약 시 개인정보 보호 관련 사항을 명시하고 수탁자가 이를 준수하도록 관리·감독합니다.',
    ],
  },
  {
    id: 6,
    title: '제6조 정보주체의 권리·의무',
    content: '이용자는 언제든지 다음 각 호의 권리를 행사할 수 있습니다.',
    list: [
      '개인정보 열람 청구: 서비스가 보유한 본인의 개인정보 확인 요청',
      '개인정보 정정·삭제 청구: 오류가 있거나 불필요한 개인정보의 수정 또는 삭제 요청',
      '개인정보 처리정지 청구: 동의를 철회하거나 처리 정지 요청',
      '개인정보 이동 청구: 처리하는 개인정보를 구조화된 형식으로 받을 권리',
      '권리 행사는 서비스 내 [마이페이지 > 개인정보 설정] 메뉴 또는 privacy@claiq.kr 이메일로 요청하실 수 있습니다.',
      '만 14세 미만 아동의 경우 법정대리인이 권리를 행사합니다.',
    ],
  },
  {
    id: 7,
    title: '제7조 개인정보 자동수집 장치 설치·운영 거부',
    content: '서비스는 세션 유지 및 이용 편의를 위해 쿠키(Cookie)와 로컬 스토리지를 사용합니다.',
    list: [
      '쿠키 사용 목적: 로그인 상태 유지, 사용자 환경 설정 저장',
      '쿠키 거부 방법: 브라우저 설정(Chrome: 설정 > 개인정보 및 보안 > 쿠키 및 기타 사이트 데이터)에서 거부 가능',
      '쿠키를 거부할 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.',
    ],
  },
  {
    id: 8,
    title: '제8조 개인정보 보호책임자',
    content: '서비스는 개인정보 처리에 관한 업무를 총괄하고 관련 불만 처리 및 피해 구제를 담당하는 개인정보 보호책임자를 지정합니다.',
    list: [
      '개인정보 보호책임자: CLAIQ 개인정보보호팀 팀장',
      '연락처 이메일: privacy@claiq.kr',
      '민원 접수: 이메일 접수 후 영업일 기준 3일 이내 회신',
      '기타 개인정보침해 신고·상담: 개인정보보호위원회(privacy.go.kr / 국번없이 182)',
    ],
  },
  {
    id: 9,
    title: '제9조 개인정보 처리방침 변경 안내',
    content: null,
    list: [
      '이 개인정보 처리방침은 2026년 1월 1일부터 적용됩니다.',
      '방침 변경 시 변경 사유 및 내용을 서비스 내 공지사항을 통해 시행일 7일 전부터 공지합니다.',
      '중요한 변경(수집 항목 추가, 제3자 제공 추가 등)의 경우 30일 전 사전 공지합니다.',
    ],
  },
  {
    id: 10,
    title: '제10조 만 14세 미만 아동의 개인정보 처리 제한',
    content: null,
    list: [
      '서비스는 만 14세 미만 아동의 회원 가입 시 법정대리인(부모 등)의 동의를 필수로 요구합니다.',
      '법정대리인은 아동의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.',
      '법정대리인의 동의 없이 수집된 아동 개인정보가 확인될 경우 즉시 삭제 조치합니다.',
      '법정대리인 동의 및 권리 행사 문의: privacy@claiq.kr',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-lg font-bold text-zinc-900 tracking-tight">CLAIQ</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">개인정보 처리방침</h1>
          <p className="mt-2 text-sm text-zinc-500">시행일: 2026년 1월 1일</p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6 space-y-8">
          <p className="text-sm text-zinc-700 leading-relaxed">
            CLAIQ(이하 "서비스" 또는 "회사")는 개인정보보호법(PIPA), 정보통신망 이용촉진 및 정보보호 등에
            관한 법률 등 관계 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고
            원활하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          {sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-base font-semibold text-zinc-900 mb-3">{section.title}</h2>
              {section.content && (
                <p className="text-sm text-zinc-700 leading-relaxed mb-2">{section.content}</p>
              )}
              {section.list && (
                <ul className="space-y-1.5 pl-4">
                  {section.list.map((item, idx) => (
                    <li key={idx} className="text-sm text-zinc-700 leading-relaxed list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
