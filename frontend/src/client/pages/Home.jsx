import React, { useEffect, useState } from "react";
import { useTheme, themeUtils } from "../../shared/components/ThemeProvider";
import { clientTheme } from "../styles/ClientTheme";
import { FaInstagram } from "react-icons/fa";

export default function Home() {
  const theme = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');
  const light = themeUtils.getColor(theme, 'light');

  // 🧩 clientTheme 기반 스타일
  const { mainCard, secondaryCard, smallCard, iconColors } = clientTheme.home;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 부드러운 페이드 인
  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // 모달 열림/닫힘 시 body 스크롤 제어
  useEffect(() => {
    if (showProfile || showBusiness) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showProfile, showBusiness]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showProfile) setShowProfile(false);
        if (showBusiness) setShowBusiness(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showProfile, showBusiness]);

  return (
    <section className="relative min-h-[calc(100vh-0px)] flex flex-col justify-center items-center text-center px-4 py-8 overflow-hidden dark-gradient-bg">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-light/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/8 rounded-full blur-3xl"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div
        className={`relative z-10 w-full max-w-6xl mx-auto transition-all duration-700 ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* 로고와 슬로건 */}
        <div className="mb-12">
          <div className="text-center">
            <div className="mb-6">
              <img
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FyqW4L%2FbtsQDbCqlgQ%2FAAAAAAAAAAAAAAAAAAAAABI9RXHqXJ6XSXpNFdsQwPbu4zo9nPIOKXoxwbMo4hH0%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1759244399%26allow_ip%3D%26allow_referer%3D%26signature%3DqqLlYwHqMc9Ap4MESmCem2kcSQ8%253D"
                alt="강민성 한국사"
                className="h-24 w-auto object-contain mx-auto"
              />
            </div>
            <p className="text-white text-sm sm:text-lg opacity-90 mb-4">
              이해와 흐름으로 보는 한국사
            </p>
          </div>
        </div>

        {/* 2개 주요 박스 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
          {/* 유튜브 */}
          <a
            href="https://youtube.com/@%ED%95%9C%EA%B5%AD%EC%82%AC%EA%B0%95%EB%AF%BC%EC%84%B1"
            target="_blank"
            rel="noreferrer"
            className="text-left group card-hover rounded-lg"
            style={{
              backgroundColor: mainCard.backgroundColor,
              backdropFilter: mainCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${mainCard.borderWidth} solid ${mainCard.borderColor}`,
              borderRadius: mainCard.borderRadius,
              padding: mainCard.padding,
              transition: mainCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = mainCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = mainCard.backgroundColor;
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-medium mb-2">YOUTUBE</div>
                <div className="text-white text-2xl font-bold mb-2">
                  강민성 한국사
                </div>
                <div className="text-white text-sm opacity-80">한국사 수업 듣기</div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: `${primary}33`, // primary with 20% opacity
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="material-icons text-white text-xl">arrow_forward</i>
              </div>
            </div>
          </a>

          {/* 네이버 카페 */}
          <a
            href="https://cafe.naver.com/kmshistory"
            target="_blank"
            rel="noreferrer"
            className="text-left group card-hover rounded-lg"
            style={{
              backgroundColor: secondaryCard.backgroundColor,
              backdropFilter: secondaryCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${secondaryCard.borderWidth} solid ${secondaryCard.borderColor}`,
              borderRadius: secondaryCard.borderRadius,
              padding: secondaryCard.padding,
              transition: secondaryCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = secondaryCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = secondaryCard.backgroundColor;
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-medium mb-2">네이버 카페</div>
                <div className="text-white text-2xl font-bold mb-2">
                  강민성의 정통한국사
                </div>
                <div className="text-white text-sm opacity-90">
                  수강생 커뮤니티 참여하기
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: `${secondary}33`, // secondary with 20% opacity
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="material-icons text-white text-xl">arrow_forward</i>
              </div>
            </div>
          </a>
        </div>

        {/* 인스타그램 및 틱톡 컨테이너 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto" style={{ minHeight: '100px' }}>
          {/* 인스타그램 */}
          <a
            href="https://instagram.com/thekmshistory"
            target="_blank"
            rel="noreferrer"
            className="card-hover rounded-lg"
            style={{
              backgroundColor: smallCard.backgroundColor,
              backdropFilter: smallCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${smallCard.borderWidth} solid ${smallCard.borderColor}`,
              borderRadius: smallCard.borderRadius,
              padding: smallCard.padding,
              transition: smallCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.backgroundColor;
            }}
          >
            <div className="flex items-start">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative mr-4"
                style={{ backgroundColor: '#E4405F' }}
              >
                <FaInstagram className="text-white text-lg sm:text-xl" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white text-base sm:text-lg font-semibold mb-1">인스타그램</h3>
                <p className="text-white text-sm opacity-80 leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '200px' }}>
                  @thekmshistory
                </p>
              </div>
            </div>
          </a>

          {/* 틱톡 */}
          <a
            href="https://www.tiktok.com/@kmshistory"
            target="_blank"
            rel="noreferrer"
            className="card-hover rounded-lg"
            style={{
              backgroundColor: smallCard.backgroundColor,
              backdropFilter: smallCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${smallCard.borderWidth} solid ${smallCard.borderColor}`,
              borderRadius: smallCard.borderRadius,
              padding: smallCard.padding,
              transition: smallCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.backgroundColor;
            }}
          >
            <div className="flex items-start">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative mr-4"
                style={{ backgroundColor: '#000000' }}
              >
                <i className="material-icons text-white text-lg sm:text-xl">music_note</i>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white text-base sm:text-lg font-semibold mb-1">틱톡</h3>
                <p className="text-white text-sm opacity-80 leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '200px' }}>
                  @kmshistory
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* 하단 3개 박스 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {/* 강민성 소개 */}
          <button
            onClick={() => setShowProfile(true)}
            className="card-hover rounded-lg"
            style={{
              backgroundColor: smallCard.backgroundColor,
              backdropFilter: smallCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${smallCard.borderWidth} solid ${smallCard.borderColor}`,
              borderRadius: smallCard.borderRadius,
              padding: smallCard.padding,
              transition: smallCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.backgroundColor;
            }}
          >
            <div className="flex items-start">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative mr-4"
                style={{ backgroundColor: iconColors.blue }}
              >
                <i className="material-icons text-white text-lg sm:text-xl">account_circle</i>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white text-base sm:text-lg font-semibold mb-1">강민성 소개</h3>
                <p className="text-white text-sm opacity-80 leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '200px' }}>
                  강민성 선생님, 한눈에 보기
                </p>
              </div>
            </div>
          </button>

          {/* 강연신청 */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfaDMefOXCTWOfxO4krHX3XtOoCYipCRzEQYE06hzrnL2i8UQ/viewform"
            target="_blank"
            rel="noreferrer"
            className="card-hover rounded-lg"
            style={{
              backgroundColor: smallCard.backgroundColor,
              backdropFilter: smallCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${smallCard.borderWidth} solid ${smallCard.borderColor}`,
              borderRadius: smallCard.borderRadius,
              padding: smallCard.padding,
              transition: smallCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.backgroundColor;
            }}
          >
            <div className="flex items-start">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative mr-4"
                style={{ backgroundColor: iconColors.yellow }}
              >
                <i className="fa-solid fa-chalkboard-teacher text-white text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white text-lg font-semibold mb-1">강연신청</h3>
                <p className="text-white text-sm opacity-80 leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '200px' }}>
                  필요한 곳이 있다면, 말씀해주세요.
                </p>
              </div>
            </div>
          </a>

          {/* 협업문의 */}
          <button
            onClick={() => setShowBusiness(true)}
            className="card-hover rounded-lg"
            style={{
              backgroundColor: smallCard.backgroundColor,
              backdropFilter: smallCard.backdropBlur ? 'blur(4px)' : 'none',
              border: `${smallCard.borderWidth} solid ${smallCard.borderColor}`,
              borderRadius: smallCard.borderRadius,
              padding: smallCard.padding,
              transition: smallCard.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = smallCard.backgroundColor;
            }}
          >
            <div className="flex items-start">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative mr-4"
                style={{ backgroundColor: iconColors.green }}
              >
                <i className="fa-solid fa-handshake text-white text-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white text-lg font-semibold mb-1">협업문의</h3>
                <p className="text-white text-sm opacity-80 leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '200px' }}>
                  협업할 일이 있다면, 연락 주세요.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ====== 강민성 소개 모달 ====== */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="relative top-10 mx-auto p-0 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-lg overflow-hidden bg-gradient-to-br from-primary/95 to-secondary/95 backdrop-blur-sm border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h3 className="text-xl font-bold text-white">강민성 선생님 소개</h3>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-white/70 hover:text-white transition-colors"
                  type="button"
                >
                  <i className="material-icons text-xl">close</i>
                </button>
              </div>
              
              {/* 메인 콘텐츠 */}
              <div className="flex flex-col lg:flex-row">
                {/* 좌측: 텍스트 콘텐츠 */}
                <div className="flex-1 p-6 lg:p-8 text-left">
                  <div className="mb-6 text-left">
                    <h4 className="text-2xl font-bold text-white mb-2 text-left">강민성</h4>
                    <p className="text-white/80 text-sm sm:text-lg text-left">이해와 흐름으로 보는 한국사</p>
                  </div>

                  <br />
                  
                  <div className="space-y-6 text-white/90 text-left">
                    <div className="text-left">
                      <h5 className="font-bold text-white mb-3 text-lg sm:text-2xl text-left">📚 주요 경력</h5>
                      <ul className="space-y-2 text-md">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-white/60 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          서울대학교 국사학과 졸업
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-white/60 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          前 EBSi 강의, EBSlang 강의, EBS 교재 집필
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-white/60 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          추천하고 싶은 강사 - 역사 부문 1위(중앙일보 선정)
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-white/60 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="tracking-tight break-words leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '280px' }}>
                            서울대생들이 선정한 전과목에서 가장 많이 수강한 강사 1위(한국리서치 선정)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-white/60 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="tracking-tight break-words leading-tight" style={{ wordBreak: 'keep-all', lineHeight: '1.3', maxWidth: '280px' }}>
                            서울대생들이 선정한 전과목에서 가장 성적 향상·유지에 도움된 강사 1위(한국리서치 선정)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* 우측: 이미지 */}
                <div className="lg:w-80 xl:w-96 p-6 lg:p-8 flex items-center justify-center bg-white/5">
                  <div className="w-full max-w-sm">
                    <img
                      src="/profile.png"
                      alt="강민성 선생님"
                      className="w-full h-auto rounded-lg shadow-lg object-cover"
                    />
                  </div>
                </div>
              </div>
              
              {/* 푸터 */}
              <div className="flex justify-end p-6 border-t border-white/20">
                <button
                  onClick={() => setShowProfile(false)}
                  className="px-6 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  type="button"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== 비즈니스 문의 모달 ====== */}
      {showBusiness && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowBusiness(false)}
        >
          <div
            className="relative top-20 mx-auto p-0 w-11/12 md:w-3/5 lg:w-2/5 shadow-2xl rounded-lg overflow-hidden bg-gradient-to-br from-primary/95 to-secondary/95 backdrop-blur-sm border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h3 className="text-xl font-bold text-white">비즈니스 문의</h3>
                <button
                  onClick={() => setShowBusiness(false)}
                  className="text-white/70 hover:text-white transition-colors"
                  type="button"
                >
                  <i className="material-icons text-xl">close</i>
                </button>
              </div>
              
              {/* 메인 콘텐츠 */}
              <div className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-envelope text-white text-2xl"></i>
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-white/90 text-lg mb-4">비즈니스 문의 메일</p>
                  <p className="text-white text-xl font-bold">official@kmshistory.kr</p>
                </div>
              </div>
              
              {/* 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-white/20">
                <button
                  onClick={() => setShowBusiness(false)}
                  className="px-6 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  type="button"
                >
                  확인
                </button>
                <a
                  href="mailto:official@kmshistory.kr"
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200"
                >
                  메일 보내기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
