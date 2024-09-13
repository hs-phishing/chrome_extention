// 실제 동작하는 부분
// 사용자가 브라우저 mouseover -> 링크 url 분석 -> 피싱여부 판별

// 크롬 확장 프로그램의 메시지를 수신하는 리스너 설정
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log("Message received in background:", request); // 메시지 수신 확인
  
//     if (request.type === "checkPhishing") {
//       const url = request.url;
//       console.log("Checking phishing for URL:", url); // URL 확인 로그
//       try {
//         const result = checkPhishing(url);
//         sendResponse(result);
//       } catch (error) {
//         console.error("Phishing check failed:", error);
//         sendResponse({ risk: -1, probability: 0 });
//       }
//     }
//     return true; // 비동기 응답을 위해 true 반환
//   });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkPhishing") {
    const url = request.url;
    fetch('http://localhost:5000/api/url/simple', {
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
    return true; // 이렇게 반환하면 비동기 응답이 가능합니다.
  }
});
  
  async function checkPhishing(url) {
    const apiURL = 'http://127.0.0.1:5000/api/url/simple'; // API 주소
  
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
  