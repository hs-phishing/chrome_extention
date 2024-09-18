document.addEventListener('DOMContentLoaded', function () {
    const statusElement = document.getElementById('status');
    const enableDetectionCheckbox = document.getElementById('enable-detection-toggle');

    // 저장된 설정 값을 가져와서 체크박스 상태를 업데이트 (디폴트는 비활성화)
    chrome.storage.sync.get('detectionEnabled', function(result) {
        const isEnabled = result.detectionEnabled !== undefined ? result.detectionEnabled : false;
        enableDetectionCheckbox.checked = isEnabled;
        updateStatus(isEnabled);
    });

    // 체크박스 상태가 변경되었을 때 설정 값을 저장
    enableDetectionCheckbox.addEventListener('change', function() {
        const isEnabled = enableDetectionCheckbox.checked;
        chrome.storage.sync.set({ detectionEnabled: isEnabled }, function() {
            updateStatus(isEnabled);

            // 현재 활성화된 탭에 메시지 보내기
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "toggleDetection", enabled: isEnabled });
                }
            });
        });
    });

    function updateStatus(isEnabled) {
        statusElement.textContent = isEnabled ? "Enabled" : "Disabled";
        statusElement.className = isEnabled ? "status-indicator enabled" : "status-indicator disabled";
    }
});
