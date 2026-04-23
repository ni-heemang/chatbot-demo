document.addEventListener('DOMContentLoaded', () => {
  injectHeader();
  injectFooter();
  initMobileMenu();
  initScrollAnimations();
});

function injectHeader() {
  const placeholder = document.getElementById('header');
  if (!placeholder) return;

  placeholder.outerHTML = `<header class="site-header">
  <div class="header-inner container">
    <a href="/" class="header-logo">
      <img src="https://cdn.prod.website-files.com/69a92999adf230c97361a6c2/69ba2bf9ccc7adf28d952a5e_OA_logo.svg" alt="OfficeAgent" height="32">
    </a>
    <nav class="header-nav" id="headerNav">
      <div class="nav-item">
        솔루션 <span class="arrow">▾</span>
        <div class="dropdown">
          <a href="/office-agent">오피스에이전트</a>
          <a href="/feature-details">기능 상세 설명</a>
        </div>
      </div>
      <div class="nav-item">
        도입 <span class="arrow">▾</span>
        <div class="dropdown">
          <a href="/price">요금안내</a>
          <a href="/product-brochure">제품소개서</a>
          <a href="/get-started">도입문의</a>
          <a href="https://whattime.co.kr/officeagent" target="_blank" rel="noopener noreferrer">상담예약 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align:middle;margin-left:4px;"><path d="M3.5 2h6.5v6.5M9.5 2.5L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </div>
      </div>
      <div class="nav-item">
        콘텐츠 <span class="arrow">▾</span>
        <div class="dropdown">
          <a href="/blog-list">블로그</a>
        </div>
      </div>
      <div class="nav-item">
        지원 <span class="arrow">▾</span>
        <div class="dropdown">
          <a href="/webinar">Webinar</a>
          <a href="/faq">FAQ</a>
        </div>
      </div>
    </nav>
    <button class="mobile-toggle" id="mobileToggle" aria-label="메뉴">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function injectFooter() {
  const placeholder = document.getElementById('footer');
  if (!placeholder) return;

  placeholder.outerHTML = `<footer class="site-footer">
  <div class="footer-inner container">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="https://cdn.prod.website-files.com/69a92999adf230c97361a6c2/69ba2bf9ccc7adf28d952a5e_OA_logo.svg" alt="OfficeAgent" height="28" style="filter: brightness(0) invert(1);">
        <p>보안 걱정 없이, 우리 회사 데이터로 일하는 AI 파트너<br>우리 회사 문서와 지식을 바탕으로 업무를 함께 해결합니다.</p>
      </div>
      <div class="footer-links">
        <h4>솔루션</h4>
        <a href="/office-agent">오피스에이전트</a>
        <a href="/feature-details">기능 상세 설명</a>
      </div>
      <div class="footer-links">
        <h4>도입</h4>
        <a href="/price">요금안내</a>
        <a href="/product-brochure">제품소개서</a>
        <a href="/get-started">도입문의</a>
        <a href="https://whattime.co.kr/officeagent" target="_blank" rel="noopener noreferrer">상담예약 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align:middle;margin-left:2px;"><path d="M3.5 2h6.5v6.5M9.5 2.5L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
      <div class="footer-links">
        <h4>콘텐츠</h4>
        <a href="/blog-list">블로그</a>
      </div>
      <div class="footer-links">
        <h4>지원</h4>
        <a href="/webinar">Webinar</a>
        <a href="/faq">FAQ</a>
        <a href="https://www.jiransoft.co.kr" target="_blank" rel="noopener noreferrer">회사소개 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align:middle;margin-left:2px;"><path d="M3.5 2h6.5v6.5M9.5 2.5L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-company-info">
        (주)지란지교소프트 | 대표: 박승애 | 사업자등록번호: 314-81-14867 | 통신판매업신고번호: 2015-대전유성-0318<br>
        경기: 성남시 수정구 금토로80번길 37, W동 11층 (인피니티타워)<br>
        대전: 유성구 테크노중앙로 74, 2층 (신영빌딩)<br>
        T.031-606-9350
      </div>
      <p>&copy; Copyright 2025 | Design &amp; Developed By - License | Powered By</p>
    </div>
  </div>
</footer>`;
}

function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('headerNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
}
