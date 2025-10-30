# Scripts

## Google OAuth 토큰 발급/갱신

### 사용법

```bash
python scripts/renew_google_token.py
```

### 단계

1. 스크립트 실행 후 `1` 입력
2. 브라우저에서 출력된 URL로 이동하여 Google 로그인
3. 리다이렉트된 URL 전체를 복사
4. 스크립트 재실행 후 `2` 입력
5. 복사한 URL 붙여넣기
6. `token.json` 생성 완료!

### 필요한 경우

- 최초 설정 시
- 토큰 만료 시
- 권한(스코프) 변경 시
