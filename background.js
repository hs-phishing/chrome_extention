chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkPhishing") {
    const url = request.url;
    fetch('http://43.203.35.252:5000/api/url/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({ risk: data.prediction_result, probability: data.prediction_prob });
    })
    .catch(error => {
      console.error('Error:', error);
      sendResponse({ risk: -1, probability: 0 });
    });
    return true;
  }
});

  
  async function checkPhishing(url) {
    const apiURL = 'http://43.203.35.252:5000/api/url/simple'; // API 주소, https로 수정필요
  
    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url }) // 요청 본문
      });
  
      const data = await response.json(); // JSON 응답을 파싱
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // API로부터 받은 데이터를 사용하여 결과를 반환
      return {
        risk: data.prediction_result, // 예측 결과
        probability: parseFloat(data.prediction_prob) // 예측 확률
      };
    } catch (error) {
      console.error('Failed to fetch phishing data:', error);
      return { risk: 0, probability: 50 }; // 에러 발생 시 의심
    }
  }
  