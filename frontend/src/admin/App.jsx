import React from "react";
import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";

const koreanMessages = {
  ...englishMessages,
  ra: {
    ...englishMessages.ra,
    auth: {
      ...englishMessages.ra.auth,
      username: "아이디",
      password: "비밀번호",
      sign_in: "로그인",
      sign_in_error: "아이디 또는 비밀번호를 확인해 주세요.",
    },
    validation: {
      ...englishMessages.ra.validation,
      required: "필수",
    },
  },
};

const i18nProvider = polyglotI18nProvider(
  () => koreanMessages,
  "ko",
  [{ locale: "ko", name: "한국어" }],
  { allowMissing: true }
);
import AdminLayout from "./components/AdminLayout";
import { adminTheme } from "./styles/AdminTheme";
import Dashboard from "./pages/Dashboard";
import AdminNotices from "./pages/Notices";
import NoticeCreate from "./pages/NoticeCreate";
import NoticeDetail from "./pages/NoticeDetail";
import NoticeEdit from "./pages/NoticeEdit";
import AdminFAQ from "./pages/FAQ";
import FAQCreate from "./pages/FAQCreate";
import FAQDetail from "./pages/FAQDetail";
import FAQEdit from "./pages/FAQEdit";
import DrawList from "./pages/DrawList";
import DrawDetail from "./pages/DrawDetail";
import DrawSelect from "./pages/DrawSelect";
import DrawResult from "./pages/DrawResult";
import Participants from "./pages/Participants";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Schedule from "./pages/Schedule";
import Notifications from "./pages/Notifications";
import QuizManager from "./pages/QuizManager";
import QuizStats from "./pages/QuizStats";
import AdminLogin from "./pages/AdminLogin";

export default function AdminApp() {
  return (
    <Admin
      basename="/admin"
      authProvider={authProvider}
      dataProvider={dataProvider}
      i18nProvider={i18nProvider}
      loginPage={AdminLogin}
      layout={(props) => (
        <AdminLayout {...props} theme={adminTheme}>
          {props.children}
        </AdminLayout>
      )}
      theme={adminTheme}
    >
      {/* 커스텀 라우트 - 대시보드 */}
      <CustomRoutes>
        <Route path="" element={<Dashboard />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="notices/create" element={<NoticeCreate />} />
        <Route path="notices/:noticeId" element={<NoticeDetail />} />
        <Route path="notices/:noticeId/edit" element={<NoticeEdit />} />
        <Route path="faq" element={<AdminFAQ />} />
        <Route path="faq/new" element={<FAQCreate />} />
        <Route path="faq/:faqId" element={<FAQDetail />} />
        <Route path="faq/:faqId/edit" element={<FAQEdit />} />
        <Route path="draw" element={<DrawList />} />
        <Route path="draw/select" element={<DrawSelect />} />
        <Route path="draw/result" element={<DrawResult />} />
        <Route path="draw/:drawId" element={<DrawDetail />} />
        <Route path="participants" element={<Participants />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="quiz" element={<QuizManager />} />
        <Route path="quiz/stats" element={<QuizStats />} />
      </CustomRoutes>
      
      {/* 리소스는 준비되면 개별 파일에서 import 후 등록하세요 */}
    </Admin>
  );
}
