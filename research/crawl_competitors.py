"""
2026 KIT 바이브코딩 공모전 경쟁작 병렬 크롤러
Playwright async API + asyncio.gather 로 병렬 실행
"""

import asyncio
import json
import re
from datetime import datetime
from playwright.async_api import async_playwright

TARGETS = [
    {
        "id": "linkon",
        "repo": "https://github.com/Jason-hub-star/gongmo1",
        "extra": [],
    },
    {
        "id": "baegok",
        "repo": "https://github.com/projectmiluju/baegok",
        "extra": [],
    },
    {
        "id": "sensitive",
        "repo": "https://github.com/byungwook-dev/Sensitive",
        "extra": ["https://github.com/byungwook-dev/Sensitive/tree/main"],
    },
    {
        "id": "aIcontest",
        "repo": "https://github.com/HaYul0611/AIcontest",
        "extra": ["https://aicontest-wheat.vercel.app"],
    },
    {
        "id": "kit_contest",
        "repo": "https://github.com/NamDanChu/KIT_Contest",
        "extra": [],
    },
    {
        "id": "fourman",
        "repo": "https://github.com/jwhong48250-commits/fourman",
        "extra": [],
    },
]

# 공모전 공식 페이지 후보
COMPETITION_URLS = [
    "https://www.kumoh.ac.kr",
    "https://www.kitw.ac.kr",
]

# GitHub 검색 — 더 많은 참가자 발굴
SEARCH_QUERIES = [
    "https://github.com/search?q=KIT+%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9+%EA%B3%B5%EB%AA%A8%EC%A0%84&type=repositories&s=updated&o=desc",
    "https://github.com/search?q=2026+KIT+%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9&type=repositories",
    "https://github.com/search?q=%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9+%EA%B3%B5%EB%AA%A8%EC%A0%84+2026&type=repositories&s=updated&o=desc",
]


async def scrape_github_repo(browser, target: dict) -> dict:
    """GitHub 리포지토리 상세 정보 크롤링"""
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    page = await context.new_page()
    result = {"id": target["id"], "repo_url": target["repo"], "pages": {}}

    try:
        # 1. 메인 리포 페이지
        print(f"  [{target['id']}] 리포 메인 크롤링...")
        await page.goto(target["repo"], wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        repo_data = {}

        # 제목/설명
        try:
            repo_data["title"] = await page.title()
        except:
            repo_data["title"] = ""

        # About 설명
        try:
            about = await page.query_selector('[data-testid="repo-description"], .f4.my-3')
            repo_data["description"] = (await about.inner_text()).strip() if about else ""
        except:
            repo_data["description"] = ""

        # 언어
        try:
            lang_els = await page.query_selector_all('[data-testid="repository-language-stats"] li, .BorderGrid-cell .color-fg-default')
            langs = []
            for el in lang_els[:6]:
                text = (await el.inner_text()).strip()
                if text:
                    langs.append(text)
            repo_data["languages"] = langs
        except:
            repo_data["languages"] = []

        # 스타/포크/워처
        try:
            stars_el = await page.query_selector('#repo-stars-counter-star, [data-testid="stargazers-count"]')
            repo_data["stars"] = (await stars_el.inner_text()).strip() if stars_el else "0"
        except:
            repo_data["stars"] = "0"

        # 토픽/태그
        try:
            topic_els = await page.query_selector_all('[data-testid="topic-tag"], .topic-tag')
            repo_data["topics"] = [await el.inner_text() for el in topic_els]
        except:
            repo_data["topics"] = []

        # 커밋 수
        try:
            commit_el = await page.query_selector('[data-testid="commits-count"], .commits .Link--primary strong')
            commit_text = (await commit_el.inner_text()).strip() if commit_el else ""
            repo_data["commits"] = commit_text
        except:
            repo_data["commits"] = ""

        # 파일 목록 (루트)
        try:
            file_els = await page.query_selector_all('[aria-label="Files"] .react-directory-row-name-cell-large-screen, .js-navigation-item .js-navigation-open')
            files = []
            for el in file_els[:20]:
                text = (await el.inner_text()).strip()
                if text:
                    files.append(text)
            repo_data["root_files"] = files
        except:
            repo_data["root_files"] = []

        # README 내용
        try:
            readme_el = await page.query_selector('[data-testid="readme"], article.markdown-body, #readme .Box-body')
            if readme_el:
                readme_text = (await readme_el.inner_text()).strip()
                repo_data["readme"] = readme_text[:5000]  # 최대 5000자
            else:
                repo_data["readme"] = ""
        except:
            repo_data["readme"] = ""

        # package.json 혹은 requirements.txt 링크 찾기
        try:
            pkg_link = await page.query_selector('a[title="package.json"], a[title="requirements.txt"], a[title="pyproject.toml"]')
            repo_data["has_package_json"] = pkg_link is not None
        except:
            repo_data["has_package_json"] = False

        result["pages"]["repo"] = repo_data

        # 2. package.json 내용 크롤링 (스택 파악용)
        try:
            pkg_url = target["repo"].replace("github.com", "raw.githubusercontent.com") + "/main/package.json"
            pkg_page = await context.new_page()
            await pkg_page.goto(pkg_url, wait_until="domcontentloaded", timeout=10000)
            content = await pkg_page.content()
            if "dependencies" in content or "devDependencies" in content:
                text = await pkg_page.inner_text("body")
                try:
                    pkg_data = json.loads(text)
                    deps = list(pkg_data.get("dependencies", {}).keys())
                    dev_deps = list(pkg_data.get("devDependencies", {}).keys())
                    result["pages"]["package_json"] = {
                        "dependencies": deps,
                        "devDependencies": dev_deps,
                        "scripts": list(pkg_data.get("scripts", {}).keys()),
                    }
                except:
                    result["pages"]["package_json"] = {"raw": text[:1000]}
            await pkg_page.close()
        except:
            result["pages"]["package_json"] = {}

        # 3. Extra 페이지들 (배포 URL 등)
        for extra_url in target.get("extra", []):
            try:
                print(f"  [{target['id']}] extra: {extra_url}")
                extra_page = await context.new_page()
                await extra_page.goto(extra_url, wait_until="domcontentloaded", timeout=20000)
                await extra_page.wait_for_timeout(2000)

                title = await extra_page.title()
                body_text = await extra_page.inner_text("body")

                result["pages"][f"extra_{extra_url}"] = {
                    "title": title,
                    "content": body_text[:3000],
                }
                await extra_page.close()
            except Exception as e:
                result["pages"][f"extra_{extra_url}"] = {"error": str(e)}

    except Exception as e:
        result["error"] = str(e)
        print(f"  [{target['id']}] 오류: {e}")

    finally:
        await context.close()

    print(f"  [{target['id']}] 완료 ✓")
    return result


async def scrape_github_search(browser, query_url: str, idx: int) -> dict:
    """GitHub 검색으로 추가 참가작 발굴"""
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    page = await context.new_page()
    result = {"query_url": query_url, "repos": []}

    try:
        print(f"  [search-{idx}] GitHub 검색 크롤링...")
        await page.goto(query_url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(3000)

        # 검색 결과 리포 목록
        items = await page.query_selector_all('[data-testid="results-list"] > div, .search-result-widget')

        if not items:
            # 다른 셀렉터 시도
            items = await page.query_selector_all('li.repo-list-item, div[data-hpc]')

        for item in items[:15]:
            try:
                repo_info = {}

                # 리포 이름/링크
                link_el = await item.query_selector('a[href*="/"][data-hydro-click], h3 a, .v-align-middle')
                if link_el:
                    repo_info["name"] = (await link_el.inner_text()).strip()
                    repo_info["url"] = "https://github.com" + await link_el.get_attribute("href")

                # 설명
                desc_el = await item.query_selector('p.mb-1, .search-match p')
                if desc_el:
                    repo_info["description"] = (await desc_el.inner_text()).strip()

                # 업데이트 날짜
                date_el = await item.query_selector('relative-time, time')
                if date_el:
                    repo_info["updated"] = await date_el.get_attribute("datetime") or await date_el.inner_text()

                if repo_info.get("name"):
                    result["repos"].append(repo_info)
            except:
                continue

        # 전체 페이지 텍스트도 일부 저장
        page_text = await page.inner_text("body")
        result["page_text_sample"] = page_text[:2000]

    except Exception as e:
        result["error"] = str(e)
        print(f"  [search-{idx}] 오류: {e}")
    finally:
        await context.close()

    print(f"  [search-{idx}] 완료 ✓")
    return result


async def scrape_competition_page(browser, url: str) -> dict:
    """공모전 공식 페이지 크롤링"""
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    page = await context.new_page()
    result = {"url": url}

    try:
        print(f"  [competition] {url} 크롤링...")
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)

        result["title"] = await page.title()

        # 바이브코딩 관련 링크 찾기
        links = await page.query_selector_all("a")
        vibe_links = []
        for link in links:
            try:
                text = (await link.inner_text()).strip()
                href = await link.get_attribute("href") or ""
                if any(kw in text + href for kw in ["바이브", "vibe", "공모전", "코딩"]):
                    vibe_links.append({"text": text, "href": href})
            except:
                continue
        result["vibe_links"] = vibe_links[:20]

        body = await page.inner_text("body")
        result["body_sample"] = body[:3000]

    except Exception as e:
        result["error"] = str(e)
    finally:
        await context.close()

    return result


def analyze_results(repo_results: list, search_results: list) -> dict:
    """크롤링 결과 분석 및 인사이트 도출"""
    analysis = {
        "crawled_at": datetime.now().isoformat(),
        "repos": [],
        "additional_repos": [],
        "key_insights": [],
        "tech_stack_frequency": {},
        "feature_patterns": [],
    }

    # 스택 빈도 집계
    all_deps = []

    for r in repo_results:
        repo_summary = {
            "id": r["id"],
            "url": r["repo_url"],
        }

        page = r.get("pages", {}).get("repo", {})

        repo_summary["title"] = page.get("title", "")
        repo_summary["description"] = page.get("description", "")
        repo_summary["stars"] = page.get("stars", "0")
        repo_summary["commits"] = page.get("commits", "")
        repo_summary["languages"] = page.get("languages", [])
        repo_summary["topics"] = page.get("topics", [])
        repo_summary["root_files"] = page.get("root_files", [])

        readme = page.get("readme", "")
        repo_summary["readme_length"] = len(readme)
        repo_summary["readme_preview"] = readme[:800]

        # package.json에서 주요 deps
        pkg = r.get("pages", {}).get("package_json", {})
        deps = pkg.get("dependencies", [])
        repo_summary["key_deps"] = deps
        all_deps.extend(deps)

        # Extra 페이지 (배포 등)
        extra_data = {}
        for key, val in r.get("pages", {}).items():
            if key.startswith("extra_"):
                extra_data[key] = val.get("title", "") + " | " + val.get("content", "")[:300]
        repo_summary["extra_pages"] = extra_data

        if r.get("error"):
            repo_summary["error"] = r["error"]

        analysis["repos"].append(repo_summary)

    # 스택 빈도
    from collections import Counter
    stack_count = Counter(all_deps)
    analysis["tech_stack_frequency"] = dict(stack_count.most_common(20))

    # 검색으로 발굴된 추가 리포
    for s in search_results:
        for repo in s.get("repos", []):
            if repo not in analysis["additional_repos"]:
                analysis["additional_repos"].append(repo)

    return analysis


async def main():
    print("=" * 60)
    print("2026 KIT 바이브코딩 공모전 경쟁작 병렬 크롤러")
    print("=" * 60)
    print(f"대상 리포: {len(TARGETS)}개")
    print(f"검색 쿼리: {len(SEARCH_QUERIES)}개")
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )

        print("[1단계] 병렬 크롤링 시작...")

        # 모든 작업 병렬 실행
        tasks = []

        # 각 리포 크롤링
        for target in TARGETS:
            tasks.append(scrape_github_repo(browser, target))

        # GitHub 검색 (추가 참가자 발굴)
        for i, query_url in enumerate(SEARCH_QUERIES):
            tasks.append(scrape_github_search(browser, query_url, i))

        # 전부 동시 실행
        all_results = await asyncio.gather(*tasks, return_exceptions=True)

        await browser.close()

    # 결과 분리
    repo_results = []
    search_results = []

    for i, result in enumerate(all_results):
        if isinstance(result, Exception):
            print(f"작업 {i} 예외: {result}")
            continue
        if i < len(TARGETS):
            repo_results.append(result)
        else:
            search_results.append(result)

    print()
    print("[2단계] 결과 분석 중...")
    analysis = analyze_results(repo_results, search_results)

    # JSON 저장
    output_path = "/home/pabang/myapp/award/crawl_competitors_result.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "analysis": analysis,
                "raw_repo_results": repo_results,
                "raw_search_results": search_results,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\n결과 저장: {output_path}")
    print()
    print("=" * 60)
    print("크롤링 완료 요약")
    print("=" * 60)

    for repo in analysis["repos"]:
        print(f"\n[{repo['id']}]")
        print(f"  설명: {repo['description'][:100]}")
        print(f"  언어: {', '.join(repo['languages'][:3])}")
        print(f"  커밋: {repo['commits']}")
        print(f"  주요 deps: {', '.join(repo['key_deps'][:8])}")
        print(f"  README 길이: {repo['readme_length']}자")
        if repo.get("error"):
            print(f"  오류: {repo['error']}")

    print(f"\n추가 발굴 리포: {len(analysis['additional_repos'])}개")
    for r in analysis["additional_repos"][:10]:
        print(f"  - {r.get('name', '')} | {r.get('description', '')[:60]}")

    print(f"\n자주 쓰인 스택: {list(analysis['tech_stack_frequency'].keys())[:10]}")


if __name__ == "__main__":
    asyncio.run(main())
