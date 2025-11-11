import React from 'react';

export default function Schedule() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full sm:w-[95%] md:w-[768px] lg:w-[1024px] xl:w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">일정</h1>
          <p className="text-gray-600">공식 일정을 확인하세요.</p>
        </div>
        
        {/* 구글 캘린더 iframe */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="calendar-container">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FSeoul&showPrint=0&title=%EA%B0%95%EB%AF%BC%EC%84%B1%ED%95%9C%EA%B5%AD%EC%82%AC%20%EA%B3%B5%EC%8B%9D%EC%9D%BC%EC%A0%95&src=Y19lMzA2ZGFjYmYyNWE2ZmM4MzRmNzgyNWVlMTRmYzU5MzJjYjM3Zjg2OTQ4MDU2MTEzYWYxOTYzOGNiZDFjZWI5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=a28uc291dGhfa29yZWEjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%233f51b5&color=%23e67c73"
              frameBorder="0"
              scrolling="no"
              title="강민성 한국사 공식 일정"
              style={{
                width: '100%',
                height: '100%',
                border: 'solid 1px #777',
                borderRadius: '0.5rem',
              }}
            />
          </div>
        </div>
        
        {/* 추가 안내 */}
        {/* <div className="mt-8 text-center text-sm text-gray-500">
          <p>일정은 실시간으로 업데이트됩니다.</p>
          <p className="mt-1">
            문의사항은{' '}
            <a href="mailto:official@kmshistory.kr" className="text-primary hover:underline">
              official@kmshistory.kr
            </a>
            로 연락주세요.
          </p>
        </div> */}
      </div>

      {/* 스타일 */}
      <style>{`
        /* iframe 반응형 설정 */
        .calendar-container {
          position: relative;
          width: 100%;
          height: 800px; /* 고정 높이로 설정 */
        }
        
        @media (max-width: 768px) {
          .calendar-container {
            height: 600px; /* 모바일에서는 조금 더 작게 */
          }
        }
        
        @media (min-width: 1920px) {
          .calendar-container {
            height: 900px; /* 큰 화면에서는 더 크게 */
          }
        }
      `}</style>
    </div>
  );
}








