# 프로덕션 환경 실행 가이드

## 개요
프로덕션 환경은 최적화된 정적 빌드 파일을 사용하여 안정적이고 빠른 서비스를 제공합니다.

## 구조
- **백엔드**: 포트 8006 (FastAPI + uvicorn)
- **프론트엔드**: 정적 빌드 파일 (백엔드가 서빙)

## 사용법

### 1. 프론트엔드 빌드

```bash
# 프로젝트 루트로 이동
cd /home/svuser/kmshistory/kmshistory-v2

# 프론트엔드 빌드
cd frontend
npm run build

# 빌드된 파일은 frontend/dist/ 디렉토리에 생성됩니다
```

### 2. 백엔드 실행

```bash
# 프로젝트 루트로 이동
cd /home/svuser/kmshistory/kmshistory-v2

# 백엔드 실행
cd backend
./run.sh
```

또는 systemd 서비스 사용:

```bash
# 서비스 시작
sudo systemctl start kmshistory.service

# 서비스 상태 확인
sudo systemctl status kmshistory.service

# 서비스 중지
sudo systemctl stop kmshistory.service

# 서비스 재시작
sudo systemctl restart kmshistory.service

# 부팅 시 자동 시작 활성화
sudo systemctl enable kmshistory.service
```

## 배포 프로세스

### 전체 배포 절차

```bash
# 1. 프로젝트 루트로 이동
cd /home/svuser/kmshistory/kmshistory-v2

# 2. 최신 코드 가져오기 (git 사용 시)
git pull origin main  # 또는 develop

# 3. 백엔드 의존성 업데이트 (필요 시)
source .venv/bin/activate
pip install -r requirements.txt

# 4. 프론트엔드 의존성 업데이트 (필요 시)
cd frontend
npm install

# 5. 프론트엔드 빌드
npm run build

# 6. 백엔드 재시작
cd ../backend
sudo systemctl restart kmshistory.service
# 또는 수동 실행: ./run.sh
```

## 로그 확인

### systemd 서비스 사용 시

```bash
# 실시간 로그 확인
sudo journalctl -u kmshistory.service -f

# 최근 로그 확인
sudo journalctl -u kmshistory.service -n 100

# 특정 시간대 로그 확인
sudo journalctl -u kmshistory.service --since "2024-01-01 00:00:00"
```

### 수동 실행 시

백엔드를 수동으로 실행한 경우, 터미널에 직접 출력됩니다.

## 접속 주소

- 백엔드 API: http://localhost:8006
- 프론트엔드: http://localhost:8006 (백엔드가 정적 파일 서빙)

## 스테이징과의 차이

| 항목 | 프로덕션 | 스테이징 |
|------|---------|---------|
| 프론트엔드 | 정적 빌드 파일 | 개발 서버 (Vite) |
| 코드 변경 | 빌드 필요 | 즉시 반영 |
| 백엔드 포트 | 8006 | 8007 |
| 프론트엔드 포트 | - (백엔드가 서빙) | 3004 |
| 성능 | 최적화됨 | 개발 모드 |
| 안정성 | 높음 | 개발용 |

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 포트 사용 확인
lsof -i :8006

# 프로세스 강제 종료
kill -9 <PID>
```

### 빌드 실패 시

```bash
# node_modules 삭제 후 재설치
cd frontend
rm -rf node_modules
npm install
npm run build
```

### 백엔드가 정적 파일을 찾지 못하는 경우

```bash
# 빌드 디렉토리 확인
ls -la frontend/dist/

# 빌드가 제대로 되었는지 확인
cd frontend
npm run build
```

### 서비스가 시작되지 않는 경우

```bash
# 서비스 상태 확인
sudo systemctl status kmshistory.service

# 상세 로그 확인
sudo journalctl -u kmshistory.service -n 50

# 서비스 파일 문법 확인
sudo systemd-analyze verify /etc/systemd/system/kmshistory.service

# systemd 재로드
sudo systemctl daemon-reload
sudo systemctl restart kmshistory.service
```

## 주의사항

1. **프로덕션 배포 전 반드시 빌드**: 코드 변경 후 `npm run build`를 실행해야 변경사항이 반영됩니다.

2. **환경 변수 확인**: `.env` 파일이 올바르게 설정되어 있는지 확인하세요.

3. **데이터베이스 백업**: 배포 전 데이터베이스 백업을 권장합니다.

4. **테스트**: 스테이징 환경에서 충분히 테스트한 후 프로덕션에 배포하세요.

