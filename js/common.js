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
  <div class="header-inner">
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
        </div>
      </div>
      <a href="/blog-list" class="nav-item">콘텐츠</a>
      <div class="nav-item">
        지원 <span class="arrow">▾</span>
        <div class="dropdown">
          <a href="/webinar">Webinar</a>
          <a href="/faq">FAQ</a>
        </div>
      </div>
      <a href="/get-started" class="btn-primary">상담예약</a>
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
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="https://cdn.prod.website-files.com/69a92999adf230c97361a6c2/69ba2bf9ccc7adf28d952a5e_OA_logo.svg" alt="OfficeAgent" height="28" style="filter: brightness(0) invert(1);">
        <p>우리 회사 데이터를 가장 잘 이해하는 AI</p>
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
      </div>
      <div class="footer-links">
        <h4>콘텐츠</h4>
        <a href="/blog-list">블로그</a>
      </div>
      <div class="footer-links">
        <h4>지원</h4>
        <a href="/webinar">Webinar</a>
        <a href="/faq">FAQ</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-company-info">
        (주)지란지교소프트 | 대표이사: 오치영 | 사업자등록번호: 214-86-98190<br>
        서울특별시 서초구 서초대로 396, 강남빌딩 6층
      </div>
      <p style="margin-top:8px;">&copy; 2026 Jiran. All rights reserved.</p>
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
