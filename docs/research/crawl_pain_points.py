"""
교육 공모전 기획용 페인포인트 크롤러
교사/수강생/교육운영자의 실제 고충을 네이버 검색 결과에서 수집
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
from datetime import datetime

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────

OUTPUT_PATH = "/home/pabang/myapp/award/pain_points.json"
MAX_RESULTS_PER_QUERY = 10
MAX_WORKERS = 6

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.naver.com/",
}

# 페르소나별 검색어 정의
QUERIES = {
    "교사": [
        "교사 불편사항",
        "교사 행정업무 고충",
        "교사 수업 준비 어려움",
        "교사 AI 활용 문제",
    ],
    "수강생": [
        "수강생 불만",
        "온라인 강의 단점",
        "학습 지속 어려움",
        "수강생 질문 불편",
    ],
    "교육운영자": [
        "학원 운영 어려움",
        "교육 플랫폼 문제점",
        "수강생 관리 불편",
        "교육 운영자 고충",
    ],
}

# 분석에서 제외할 불용어 (빈도가 높지만 의미 없는 단어)
STOPWORDS = {
    "수", "있", "있는", "없는", "없", "하는", "하고", "하여", "하지", "하면",
    "이", "가", "을", "를", "은", "는", "에", "의", "도", "로", "와", "과",
    "그", "이런", "저런", "더", "또", "및", "등", "것", "들", "한", "이런",
    "때문에", "때문", "위해", "위한", "통해", "통한", "대한", "대해",
    "많은", "많이", "너무", "매우", "정말", "실제", "다양한", "다양",
    "현재", "기존", "새로운", "새로", "관련", "경우", "경우에", "부분",
    "문제", "어려움", "불편", "고충", "불만", "단점", "문제점",  # 검색어 자체 제외
}

NAVER_SEARCH_URL = "https://search.naver.com/search.naver"


# ─────────────────────────────────────────────
# 크롤링 함수
# ─────────────────────────────────────────────

def fetch_naver_results(query: str) -> list[dict]:
    """
    네이버 통합검색 결과에서 블로그/카페/뉴스 제목·요약·URL 수집
    """
    params = {"query": query}
    results = []

    try:
        response = requests.get(
            NAVER_SEARCH_URL,
            params=params,
            headers=HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 네이버 통합검색 공통 결과 카드 셀렉터
        # 블로그·카페·뉴스 모두 포함되는 영역을 순서대로 시도
        selectors = [
            "li.bx",               # 블로그/카페 리스트 아이템
            "div.news_area",       # 뉴스 영역
            "div.total_area",      # 통합 결과 영역
            "div.api_subject_bx",  # API 결과 박스
        ]

        items = []
        for selector in selectors:
            found = soup.select(selector)
            if found:
                items.extend(found)
            if len(items) >= MAX_RESULTS_PER_QUERY:
                break

        # 항목이 부족하면 a 태그 전체에서 보완
        if not items:
            items = soup.select("div.g")

        for item in items[:MAX_RESULTS_PER_QUERY]:
            title, summary, url = extract_fields(item)
            if not title:
                continue
            results.append({
                "query": query,
                "title": title,
                "summary": summary,
                "url": url,
            })

    except requests.RequestException as e:
        print(f"  [오류] '{query}' 요청 실패: {e}")

    print(f"  [완료] '{query}' → {len(results)}건 수집")
    return results


def extract_fields(item) -> tuple[str, str, str]:
    """
    BeautifulSoup 태그에서 제목/요약/URL 추출
    네이버 HTML 구조 변경에 대응하기 위해 복수 셀렉터 시도
    """
    # 제목 추출 우선순위
    title_selectors = [
        "a.title_link",
        "a.news_tit",
        "span.title_txt",
        "div.title",
        "h3 a",
        "a[class*='title']",
    ]
    title = ""
    url = ""
    for sel in title_selectors:
        el = item.select_one(sel)
        if el:
            title = el.get_text(strip=True)
            url = el.get("href", "")
            break

    # 제목이 없으면 첫 번째 <a> 텍스트로 폴백
    if not title:
        a_tag = item.select_one("a")
        if a_tag:
            title = a_tag.get_text(strip=True)
            url = a_tag.get("href", "")

    # 요약 추출 우선순위
    summary_selectors = [
        "div.dsc_txt",
        "div.news_dsc",
        "span.dsc_txt_wrap",
        "div.total_dsc",
        "div.desc",
        "p.dsc_txt",
        "span[class*='dsc']",
    ]
    summary = ""
    for sel in summary_selectors:
        el = item.select_one(sel)
        if el:
            summary = el.get_text(strip=True)
            break

    # 요약이 없으면 전체 텍스트에서 제목 제거 후 보완
    if not summary and title:
        full_text = item.get_text(separator=" ", strip=True)
        summary = full_text.replace(title, "").strip()[:200]

    # URL 정규화 (네이버 내부 리다이렉트 제거)
    url = clean_url(url)

    return title, summary, url


def clean_url(url: str) -> str:
    """네이버 리다이렉트 URL에서 실제 URL 추출"""
    if not url:
        return ""
    # l.naver.com?u=실제URL 패턴 처리
    match = re.search(r"[?&]u=([^&]+)", url)
    if match:
        from urllib.parse import unquote
        return unquote(match.group(1))
    return url


# ─────────────────────────────────────────────
# 병렬 실행
# ─────────────────────────────────────────────

def crawl_all() -> dict[str, list[dict]]:
    """모든 검색어를 병렬로 크롤링하여 페르소나별로 결과 집계"""
    # (persona, query) 쌍 목록 생성
    tasks = [
        (persona, query)
        for persona, queries in QUERIES.items()
        for query in queries
    ]

    # 페르소나별 결과 버킷 초기화
    results: dict[str, list[dict]] = {persona: [] for persona in QUERIES}

    print(f"\n총 {len(tasks)}개 검색어를 {MAX_WORKERS}개 스레드로 병렬 크롤링 시작...\n")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_task = {
            executor.submit(fetch_naver_results, query): (persona, query)
            for persona, query in tasks
        }

        for future in as_completed(future_to_task):
            persona, query = future_to_task[future]
            try:
                items = future.result()
                results[persona].extend(items)
            except Exception as e:
                print(f"  [오류] '{query}' 처리 중 예외 발생: {e}")

    return results


# ─────────────────────────────────────────────
# 저장
# ─────────────────────────────────────────────

def save_results(results: dict[str, list[dict]]) -> None:
    """결과를 JSON 파일로 저장 (메타데이터 포함)"""
    output = {
        "_meta": {
            "crawled_at": datetime.now().isoformat(),
            "total": sum(len(v) for v in results.values()),
        },
        **results,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장 완료: {OUTPUT_PATH}")


# ─────────────────────────────────────────────
# 키워드 분석 (형태소 분석 없이 단순 빈도)
# ─────────────────────────────────────────────

def tokenize(text: str) -> list[str]:
    """
    한글 2글자 이상 단어 단순 추출 (형태소 분석 미사용)
    연속된 한글 문자 기준으로 분리
    """
    tokens = re.findall(r"[가-힣]{2,}", text)
    return [t for t in tokens if t not in STOPWORDS]


def analyze_keywords(results: dict[str, list[dict]]) -> None:
    """페르소나별 상위 20개 키워드 출력"""
    print("\n" + "=" * 60)
    print("페르소나별 페인포인트 키워드 분석 (상위 20개)")
    print("=" * 60)

    for persona, items in results.items():
        # 제목 + 요약 합산 텍스트
        combined_text = " ".join(
            f"{item.get('title', '')} {item.get('summary', '')}"
            for item in items
        )
        tokens = tokenize(combined_text)
        counter = Counter(tokens)
        top20 = counter.most_common(20)

        print(f"\n[{persona}] (수집 {len(items)}건)")
        print("-" * 40)
        if not top20:
            print("  (분석할 텍스트 없음)")
            continue
        for rank, (word, count) in enumerate(top20, start=1):
            bar = "█" * min(count, 30)
            print(f"  {rank:2}. {word:<10} {count:3}회  {bar}")


# ─────────────────────────────────────────────
# 진입점
# ─────────────────────────────────────────────

def main():
    print("교육 공모전 페인포인트 크롤러 시작")
    print(f"검색 대상 페르소나: {', '.join(QUERIES.keys())}")

    results = crawl_all()

    total = sum(len(v) for v in results.items() if isinstance(v, list))
    print(f"\n전체 수집 건수: {sum(len(v) for v in results.values())}건")

    save_results(results)
    analyze_keywords(results)

    print("\n완료.")


if __name__ == "__main__":
    main()
