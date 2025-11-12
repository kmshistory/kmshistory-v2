// src/admin/authProvider.js
import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_ERROR, AUTH_CHECK } from "react-admin";

export const authProvider = {
  // ✅ 로그인
  login: ({ username, password }) => {
    return fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "include", // ✅ 쿠키 포함
    })
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error("로그인 실패");
        }
        return response.json();
      })
      .then((user) => {
        // 서버가 쿠키로 토큰을 내려주기 때문에 localStorage에는 사용자 정보만 저장
        localStorage.setItem("user", JSON.stringify(user));
        return Promise.resolve();
      });
  },

  // ✅ 로그아웃
  logout: () => {
    return fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // ✅ 쿠키 포함 (쿠키 삭제 위해 필요)
    })
      .then(() => {
        localStorage.removeItem("user");
        return Promise.resolve();
      })
      .catch(() => {
        localStorage.removeItem("user");
        return Promise.resolve();
      });
  },

  // ✅ 인증 확인 (react-admin이 자동 호출)
  // 관리자 권한도 함께 확인
  checkAuth: () => {
    return fetch("/api/auth/me", {
      method: "GET",
      credentials: "include", // ✅ 쿠키 자동 포함
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((user) => {
            // 관리자 권한 확인
            if (user.role !== "admin") {
              // 관리자가 아니면 로그인 페이지로 리다이렉트
              localStorage.removeItem("user");
              window.location.href = "/login";
              return Promise.reject(new Error("관리자 권한이 필요합니다."));
            }
            // 관리자 권한이 있으면 통과
            return Promise.resolve();
          });
        }
        throw new Error("인증 실패");
      })
      .catch((error) => {
        localStorage.removeItem("user");
        return Promise.reject(error);
      });
  },

  // ✅ 에러 처리
  checkError: (error) => {
    const status = error.status || error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("user");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // ✅ 사용자 정보 (옵션)
  getIdentity: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return Promise.resolve({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // ✅ 권한 확인 (관리자 권한 반환)
  getPermissions: () => {
    // 서버에서 최신 사용자 정보를 가져와서 확인
    return fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((user) => {
            // localStorage 업데이트
            localStorage.setItem("user", JSON.stringify(user));
            if (user.role === "admin") {
              return Promise.resolve("admin");
            }
            return Promise.reject(new Error("관리자 권한이 필요합니다."));
          });
        }
        // 인증 실패 시 localStorage 정리
        localStorage.removeItem("user");
        return Promise.reject(new Error("인증이 필요합니다."));
      })
      .catch((error) => {
        // 네트워크 오류 등이 발생해도 localStorage의 사용자 정보로 재시도
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          if (user.role === "admin") {
            return Promise.resolve("admin");
          }
        } catch (e) {
          // ignore
        }
        return Promise.reject(error);
      });
  },
};
