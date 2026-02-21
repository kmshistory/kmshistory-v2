import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 로컬 회원가입 확인 비활성화 — 구글 로그인만 사용합니다.
 * /register/confirm 접근 시 로그인 페이지로 리다이렉트.
 */
export default function RegisterConfirm() {
  useEffect(() => {
    document.title = '회원가입 확인 | 강민성 한국사';
    return () => { document.title = '강민성 한국사'; };
  }, []);

  return <Navigate to="/login" replace />;
}
