import { Outlet } from 'react-router-dom';

function ClientLayout() {
  return (
    <div>
      <header>
        <nav>
          <h1>KMS History</h1>
          <ul>
            <li><a href="/">홈</a></li>
            <li><a href="/notices">공지사항</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/schedule">일정</a></li>
            <li><a href="/login">로그인</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>&copy; 2024 KMS History. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default ClientLayout;
