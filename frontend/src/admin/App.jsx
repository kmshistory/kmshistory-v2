import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';

// 임시 리소스들 (나중에 실제 구현)
const UserList = () => <div>사용자 목록</div>;
const NoticeList = () => <div>공지사항 목록</div>;
const FAQList = () => <div>FAQ 목록</div>;

function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource name="users" list={UserList} />
      <Resource name="notices" list={NoticeList} />
      <Resource name="faq" list={FAQList} />
    </Admin>
  );
}

export default AdminApp;
