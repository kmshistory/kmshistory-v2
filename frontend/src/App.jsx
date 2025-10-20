import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientLayout from './client/layouts/ClientLayout';
import AdminApp from './admin/App';
import ClientHome from './client/pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 일반 사용자 라우트 */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<ClientHome />} />
          <Route path="notices" element={<div>공지사항</div>} />
          <Route path="faq" element={<div>FAQ</div>} />
          <Route path="schedule" element={<div>일정</div>} />
          <Route path="login" element={<div>로그인</div>} />
          <Route path="register" element={<div>회원가입</div>} />
          <Route path="mypage" element={<div>마이페이지</div>} />
        </Route>
        
        {/* 관리자 라우트 - React-Admin */}
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
