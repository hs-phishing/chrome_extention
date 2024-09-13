// 사용자가 링크에 mouseover -> 이벤트 감지 및 background.js로 URL 전송
document.addEventListener('mouseover', async (event) => {
  const linkElement = event.target.closest('a');
  if (linkElement && linkElement.href) {
      const url = linkElement.href;

      try {
          const response = await sendMessageAsync({ type: "checkPhishing", url: url });
          if (response) {
              console.log('Phishing check response:', response);
              showTooltip(linkElement, response.risk, response.probability, url);
          }
      } catch (error) {
          console.error("Error in sending message:", error.message);
      }
  }
});

// 메시지를 비동기적으로 background script에 전송하고 응답을 기다리는 함수
function sendMessageAsync(message) {
  return new Promise((resolve, reject) => {
      try {
          chrome.runtime.sendMessage(message, (response) => {
              if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
              } else {
                  resolve(response);
              }
          });
      } catch (error) {
          reject(new Error("Failed to send message: " + error.message));
      }
  });
}

// 링크 요소에 툴팁을 표시하는 함수
function showTooltip(linkElement, risk, probability, url) {
  const tooltip = createTooltipElement();

  let riskText = '';
  let riskClass = '';

  switch (risk) {
      case 1:
          riskText = 'Phishing';
          riskClass = 'risk-phishing';
          break;
      case 0:
          riskText = 'Suspicious';
          riskClass = 'risk-suspicious';
          break;
      default:
          riskText = 'Safe';
          riskClass = 'risk-safe';
  }

  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-risk ${riskClass}">${riskText}</span>
      <a href="#" class="tooltip-detail-link" data-url="${url}">자세히 보기</a>
    </div>
    <div class="tooltip-body">
      피싱 사이트일 확률: <span class="tooltip-probability">${(probability * 100).toFixed(2)}%</span>
    </div>
  `;

  positionTooltip(tooltip, linkElement);
  document.addEventListener('mousemove', onMouseMoveTooltipCheck);

  // "자세히 보기" 링크 클릭 시 동작 설정
  tooltip.querySelector('.tooltip-detail-link').addEventListener('click', (e) => {
      e.preventDefault();
      const clickedUrl = e.target.getAttribute('data-url');
      openDetailedPage(clickedUrl);
  });
}

// 툴팁 위치 설정 함수
function positionTooltip(tooltip, linkElement) {
  const linkRect = linkElement.getBoundingClientRect();
  tooltip.style.left = `${linkRect.left}px`;
  tooltip.style.top = `${linkRect.bottom + window.scrollY + 5}px`;
  tooltip.style.display = 'block';

  tooltip._boundingRect = tooltip.getBoundingClientRect();
}

// 툴팁을 숨기는 함수
function hideTooltip() {
  const tooltip = document.getElementById('phishing-tooltip');
  if (tooltip) {
      tooltip.style.display = 'none';
      document.removeEventListener('mousemove', onMouseMoveTooltipCheck);
  }
}

// 생성된 툴팁 요소를 반환하거나 새로 생성하는 함수
function createTooltipElement() {
  let tooltip = document.getElementById('phishing-tooltip');
  if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'phishing-tooltip';
      tooltip.className = 'phishing-tooltip';
      document.body.appendChild(tooltip);
  }
  return tooltip;
}

// 마우스가 툴팁 및 링크 요소를 벗어나면 툴팁을 숨기는 이벤트 핸들러
function onMouseMoveTooltipCheck(event) {
  const mouseX = event.clientX;
  const mouseY = event.clientY + window.scrollY;
  const tooltip = document.getElementById('phishing-tooltip');

  if (!isMouseWithinBounds(mouseX, mouseY, tooltip._boundingRect)) {
      hideTooltip();
  }
}

// 마우스 위치가 주어진 요소의 범위 내에 있는지 확인하는 함수
function isMouseWithinBounds(mouseX, mouseY, rect) {
  return mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom + window.scrollY;
}

// "자세히 보기" 클릭 시 페이지 이동과 데이터 전송 처리
function openDetailedPage(url) {
  console.log('전송할 URL:', url); // 콘솔에 전송할 URL 출력

  // 전송할 데이터 생성 (기본 URL만 전송하는 방식)
  const requestData = {
      url: url
  };

  // API 요청
  fetch('http://43.203.35.252:5000/api/url/detailed', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
  })
  .then(response => response.json())
  .then(data => {
      console.log('전송된 피싱 데이터:', data);
      // 페이지 이동 (데이터 전송 후)
      window.open(`http://localhost:3000?original_url=${encodeURIComponent(url)}`, '_blank');
  })
  .catch(error => {
      console.error('데이터 전송 에러:', error);
  });
}
