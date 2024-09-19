// Phishing detection 활성화 여부를 저장하는 변수
let phishingDetectionEnabled = false;
let tooltipTimeout = null; // 타이머를 저장할 변수

// 비활성화/활성화 상태에 따른 동작을 설정하는 함수
chrome.storage.sync.get('detectionEnabled', function(result) {
    phishingDetectionEnabled = result.detectionEnabled !== undefined ? result.detectionEnabled : false;
    console.log('Phishing detection is', phishingDetectionEnabled ? 'enabled' : 'disabled');
});

// storage 변경 감지
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.detectionEnabled) {
        phishingDetectionEnabled = changes.detectionEnabled.newValue;
        console.log('Phishing detection is', phishingDetectionEnabled ? 'enabled' : 'disabled');
    }
});

// 마우스 오버 시 이벤트 감지 및 background.js로 URL 전송
document.addEventListener('mouseover', (event) => {
    if (!phishingDetectionEnabled) return;  // 비활성화 상태라면 동작하지 않음

    const linkElement = event.target.closest('a');
    if (linkElement && linkElement.href) {
        const url = linkElement.href;

        // 툴팁을 1초 후에 생성하기 위해 타이머 설정
        tooltipTimeout = setTimeout(async () => {
            try {
                const response = await sendMessageAsync({ type: "checkPhishing", url: url });
                if (response) {
                    console.log('Phishing check response:', response);
                    showTooltip(linkElement, response.risk, response.probability, url);
                }
            } catch (error) {
                console.error("Error in sending message:", error.message);
            }
        }, 1000); // 1초 후에 툴팁 생성
    }
});

// 마우스가 링크를 벗어날 때 타이머를 취소
document.addEventListener('mouseout', (event) => {
    const linkElement = event.target.closest('a');
    if (linkElement) {
        clearTimeout(tooltipTimeout); // 마우스가 벗어나면 타이머 취소
        hideTooltip(); // 툴팁 숨기기
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

    // 확률값에서 % 기호 제거 후 실수로 변환
    let displayProbability = parseFloat(probability.replace('%', ''));

    // 확률값이 유효한 숫자가 아니면 0을 사용
    if (isNaN(displayProbability)) {
        displayProbability = 0;
    }

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
        피싱 사이트일 확률: <span class="tooltip-probability">${displayProbability.toFixed(2)}%</span>
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
    linkElement._boundingRect = linkRect;  // 링크 요소에도 boundingRect 추가
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
    const linkElement = document.querySelector('a:hover');  // 현재 hover 중인 링크 가져오기

    if (tooltip && tooltip._boundingRect && linkElement && linkElement._boundingRect) {
        if (!isMouseWithinBounds(mouseX, mouseY, tooltip._boundingRect) &&
            !isMouseWithinBounds(mouseX, mouseY, linkElement._boundingRect)) {
            hideTooltip();
        }
    }
}

// 마우스 위치가 주어진 요소의 범위 내에 있는지 확인하는 함수
function isMouseWithinBounds(mouseX, mouseY, rect) {
    return mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom;
}

// "자세히 보기" 클릭 시 페이지 이동과 데이터 전송 처리
function openDetailedPage(url) {
    console.log('전송할 URL:', url); // 콘솔에 전송할 URL 출력
    window.open(`https://www.catch-phishing.site?original_url=${encodeURIComponent(url)}`, '_blank');
}
