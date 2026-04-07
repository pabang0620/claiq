"""
공모전 수상작 크롤링 스크립트
- KIT 바이브코딩 공모전 관련 정보 수집
- 유사 AI/코딩 공모전 수상작 GitHub 분석
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import quote

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def search_naver(query, display=10):
    """네이버 검색 결과 크롤링"""
    url = f"https://search.naver.com/search.naver?query={quote(query)}&where=web"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        results = []

        # 검색 결과 타이틀 + URL + 설명 추출
        for item in soup.select(".g.clfix, .api_subject_bx, [class*='total_wrap']")[:display]:
            title_el = item.select_one("a.link_tit, .title_link, h3 a")
            desc_el = item.select_one(".dsc_txt, .api_txt_lines")
            if title_el:
                results.append({
                    "title": title_el.get_text(strip=True),
                    "url": title_el.get("href", ""),
                    "desc": desc_el.get_text(strip=True) if desc_el else ""
                })

        return results
    except Exception as e:
        return [{"error": str(e)}]

def search_github(query, sort="stars", limit=10):
    """GitHub 공개 API로 관련 레포 검색"""
    url = f"https://api.github.com/search/repositories?q={quote(query)}&sort={sort}&per_page={limit}"
    try:
        res = requests.get(url, headers={**HEADERS, "Accept": "application/vnd.github.v3+json"}, timeout=10)
        data = res.json()
        results = []
        for item in data.get("items", []):
            results.append({
                "name": item["full_name"],
                "url": item["html_url"],
                "description": item.get("description", ""),
                "stars": item["stargazers_count"],
                "language": item.get("language", ""),
                "topics": item.get("topics", []),
                "created": item["created_at"][:10],
                "updated": item["updated_at"][:10],
            })
        return results
    except Exception as e:
        return [{"error": str(e)}]

def get_github_readme(owner_repo):
    """GitHub README 내용 가져오기"""
    url = f"https://api.github.com/repos/{owner_repo}/readme"
    try:
        res = requests.get(url, headers={**HEADERS, "Accept": "application/vnd.github.v3.raw"}, timeout=10)
        if res.status_code == 200:
            return res.text[:3000]  # 앞 3000자만
        return ""
    except:
        return ""

def get_github_structure(owner_repo):
    """GitHub 레포 파일 구조 확인"""
    url = f"https://api.github.com/repos/{owner_repo}/git/trees/HEAD?recursive=1"
    try:
        res = requests.get(url, headers={**HEADERS, "Accept": "application/vnd.github.v3+json"}, timeout=10)
        data = res.json()
        files = [item["path"] for item in data.get("tree", []) if item["type"] == "blob"]
        # 주요 파일만 필터링
        key_files = [f for f in files if any(k in f.lower() for k in [
            "readme", "claude", "ai_", "기획", "설계", ".md", "requirements", "docker", "vercel", "render"
        ])]
        return {"total_files": len(files), "key_files": key_files[:30]}
    except Exception as e:
        return {"error": str(e)}

def crawl_devpost(query):
    """Devpost 해커톤 수상작 크롤링"""
    url = f"https://devpost.com/software/search?query={quote(query)}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for item in soup.select(".software-entry")[:10]:
            title_el = item.select_one("h5 a")
            desc_el = item.select_one(".entry-body p")
            tags = [t.get_text(strip=True) for t in item.select(".platform-pill")]
            if title_el:
                results.append({
                    "title": title_el.get_text(strip=True),
                    "url": "https://devpost.com" + title_el.get("href", ""),
                    "desc": desc_el.get_text(strip=True) if desc_el else "",
                    "tags": tags
                })
        return results
    except Exception as e:
        return [{"error": str(e)}]

def main():
    report = {}

    print("=" * 60)
    print("1. KIT 바이브코딩 공모전 관련 정보 검색")
    print("=" * 60)
    queries_naver = [
        "KIT 바이브코딩 공모전 수상",
        "바이브코딩 공모전 수상작 github",
        "KIT 공모전 AI 플랫폼 수상",
    ]
    report["naver_results"] = {}
    for q in queries_naver:
        print(f"\n🔍 네이버 검색: {q}")
        results = search_naver(q, display=5)
        report["naver_results"][q] = results
        for r in results[:3]:
            if "error" not in r:
                print(f"  - {r['title'][:60]}")
                print(f"    {r['url'][:80]}")
        time.sleep(1)

    print("\n" + "=" * 60)
    print("2. GitHub 유사 공모전 수상작 검색")
    print("=" * 60)
    github_queries = [
        "바이브코딩 공모전",
        "AI education platform korea hackathon",
        "수능 AI 학습 플랫폼",
        "vibe coding competition korea",
        "KIT 공모전",
    ]
    report["github_repos"] = {}
    for q in github_queries:
        print(f"\n🔍 GitHub 검색: {q}")
        repos = search_github(q, limit=5)
        report["github_repos"][q] = repos
        for r in repos[:3]:
            if "error" not in r:
                print(f"  ⭐{r['stars']:4d} | {r['name']}")
                print(f"         {r['description'][:70] if r['description'] else '(설명 없음)'}")
        time.sleep(1)

    print("\n" + "=" * 60)
    print("3. 주목할 만한 레포 상세 분석")
    print("=" * 60)
    # 수집된 레포 중 관련성 높은 것 상세 분석
    all_repos = []
    for repos in report["github_repos"].values():
        for r in repos:
            if "error" not in r and r.get("stars", 0) >= 0:
                all_repos.append(r)

    # 중복 제거 후 상위 5개 분석
    seen = set()
    unique_repos = []
    for r in all_repos:
        if r["name"] not in seen:
            seen.add(r["name"])
            unique_repos.append(r)

    report["detailed_analysis"] = []
    for repo in unique_repos[:5]:
        print(f"\n📁 {repo['name']} (⭐{repo['stars']})")
        structure = get_github_structure(repo["name"])
        readme = get_github_readme(repo["name"])
        detail = {
            **repo,
            "structure": structure,
            "readme_preview": readme[:500] if readme else ""
        }
        report["detailed_analysis"].append(detail)
        print(f"   총 파일 수: {structure.get('total_files', 'N/A')}")
        print(f"   주요 문서: {structure.get('key_files', [])[:5]}")
        if readme:
            print(f"   README 미리보기: {readme[:200].strip()}")
        time.sleep(1)

    print("\n" + "=" * 60)
    print("4. Devpost AI 교육 해커톤 수상작")
    print("=" * 60)
    devpost_results = crawl_devpost("AI education")
    report["devpost"] = devpost_results
    for r in devpost_results[:5]:
        if "error" not in r:
            print(f"  - {r['title']}")
            print(f"    태그: {r['tags'][:3]}")
        time.sleep(0.5)

    print("\n" + "=" * 60)
    print("5. 결과 저장")
    print("=" * 60)
    with open("competition_research.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("✅ competition_research.json 저장 완료")

    # 분석 요약
    print("\n" + "=" * 60)
    print("📊 분석 요약")
    print("=" * 60)
    total_repos = sum(len(v) for v in report["github_repos"].values())
    print(f"- 네이버 검색 결과: {sum(len(v) for v in report['naver_results'].values())}건")
    print(f"- GitHub 레포 발견: {total_repos}건")
    print(f"- 상세 분석 레포: {len(report['detailed_analysis'])}건")
    print(f"- Devpost 결과: {len(report['devpost'])}건")

if __name__ == "__main__":
    main()
