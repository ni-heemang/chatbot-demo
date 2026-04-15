(function () {
  'use strict';

  // ===== 챗봇 SDK 설정 — 연동 시 이 값들만 교체 =====
  const CHATBOT_CONFIG = {
    sdkUrl: '',         // SDK JavaScript 파일 URL
    apiEndpoint: '',    // API endpoint
    token: '',          // 인증 토큰
    position: 'bottom-right',
    theme: '#2563eb',
  };

  function initChatbot() {
    if (!CHATBOT_CONFIG.sdkUrl) {
      // SDK URL 미설정 시 placeholder 위젯 표시
      const widget = document.createElement('div');
      widget.id = 'chatbot-widget-placeholder';
      widget.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        background: #2563eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37,99,235,0.4);
        z-index: 9999;
        transition: transform 0.2s ease;
      `;
      widget.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
          <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12ZM7 6H17V8H7V6Z" fill="white"/>
        </svg>`;
      widget.addEventListener('mouseenter', () => { widget.style.transform = 'scale(1.1)'; });
      widget.addEventListener('mouseleave', () => { widget.style.transform = 'scale(1)'; });
      widget.addEventListener('click', () => {
        alert('챗봇 SDK가 아직 연결되지 않았습니다.\n\njs/chatbot.js에서 CHATBOT_CONFIG.sdkUrl을 설정해주세요.');
      });
      document.body.appendChild(widget);
      return;
    }

    // SDK 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = CHATBOT_CONFIG.sdkUrl;
    script.async = true;
    script.onload = function () {
      if (window.OfficeAgentChat) {
        window.OfficeAgentChat.init({
          apiEndpoint: CHATBOT_CONFIG.apiEndpoint,
          token: CHATBOT_CONFIG.token,
          position: CHATBOT_CONFIG.position,
          theme: CHATBOT_CONFIG.theme,
        });
      }
    };
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
