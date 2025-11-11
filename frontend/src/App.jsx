import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './shared/components/ThemeProvider';
import ClientLayout from './client/components/ClientLayout';
import AdminApp from './admin/App';
import ClientHome from './client/pages/Home';
import Notices from './client/pages/Notices';
import NoticeDetail from './client/pages/NoticeDetail';
import FAQ from './client/pages/FAQ';
import Schedule from './client/pages/Schedule';
import Login from './client/pages/Login';
import Register from './client/pages/Register';
import ForgotPassword from './client/pages/ForgotPassword';
import ForgotPasswordReset from './client/pages/ForgotPasswordReset';
import MyPage from './client/pages/MyPage';
import ChangePassword from './client/pages/ChangePassword';
import EditProfile from './client/pages/EditProfile';
import Withdraw from './client/pages/Withdraw';
import PrivacyCollection from './client/pages/PrivacyCollection';
import PrivacyPolicy from './client/pages/PrivacyPolicy';
import TermsOfService from './client/pages/TermsOfService';
import MemberRequired from './client/pages/MemberRequired';
import AdminRequired from './client/pages/AdminRequired';
import QuizPlay from './client/pages/QuizPlay';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 일반 사용자 라우트 */}
        <Route
          path="/"
          element={
            <ThemeProvider theme="client">
              <ClientLayout />
            </ThemeProvider>
          }
        >
          <Route index element={<ClientHome />} />
          <Route path="notices" element={<Notices />} />
          <Route path="notices/:id" element={<NoticeDetail />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="login" element={<Login />} />
          <Route path="auth/login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="auth/forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ForgotPasswordReset />} />
          <Route path="auth/reset-password" element={<ForgotPasswordReset />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="mypage/change-password" element={<ChangePassword />} />
          <Route path="mypage/edit-profile" element={<EditProfile />} />
          <Route path="mypage/withdraw" element={<Withdraw />} />
          <Route path="privacy/collection" element={<PrivacyCollection />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="member-required" element={<MemberRequired />} />
          <Route path="admin-required" element={<AdminRequired />} />
          <Route path="quiz" element={<QuizPlay />} />
        </Route>
        
        {/* 관리자 라우트 - React-Admin */}
        <Route
          path="/admin/*"
          element={
            <ThemeProvider theme="admin">
              <AdminApp />
            </ThemeProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
