from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config import settings
import logging
import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 이메일 설정을 lazy loading으로 변경 (모듈 로드 시 생성하지 않음)
_conf = None

def get_email_config():
    """이메일 설정을 가져옵니다 (필요할 때만 생성)"""
    global _conf
    if _conf is None:
        # 디버깅: 설정 값 확인
        username_preview = settings.MAIL_USERNAME[:3] + '***' if settings.MAIL_USERNAME and len(settings.MAIL_USERNAME) > 3 else (settings.MAIL_USERNAME if settings.MAIL_USERNAME else 'None')
        logger.info(f"[이메일 설정 확인] MAIL_USERNAME: {username_preview}")
        logger.info(f"[이메일 설정 확인] MAIL_PASSWORD: {'***' if settings.MAIL_PASSWORD else 'None'}")
        logger.info(f"[이메일 설정 확인] MAIL_FROM: {settings.MAIL_FROM or '(설정되지 않음)'}")
        logger.info(f"[이메일 설정 확인] MAIL_SERVER: {settings.MAIL_SERVER}")
        logger.info(f"[이메일 설정 확인] MAIL_PORT: {settings.MAIL_PORT}")
        logger.info(f"[이메일 설정 확인] MAIL_STARTTLS: {settings.MAIL_STARTTLS}")
        logger.info(f"[이메일 설정 확인] MAIL_SSL_TLS: {settings.MAIL_SSL_TLS}")
        
        # 이메일 설정이 없으면 에러 대신 경고만 출력하고 None 반환
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.warning("이메일 설정이 없습니다. MAIL_USERNAME과 MAIL_PASSWORD를 .env 파일에 설정해주세요.")
            logger.warning("개발 환경에서는 이메일 발송이 비활성화됩니다.")
            logger.warning(f"현재 MAIL_USERNAME 값: {repr(settings.MAIL_USERNAME)}")
            logger.warning(f"현재 MAIL_PASSWORD 값: {'설정됨' if settings.MAIL_PASSWORD else 'None'}")
            return None
        
        try:
            _conf = ConnectionConfig(
                MAIL_USERNAME=settings.MAIL_USERNAME,
                MAIL_PASSWORD=settings.MAIL_PASSWORD,
                MAIL_FROM=settings.MAIL_FROM or settings.MAIL_USERNAME,
                MAIL_PORT=settings.MAIL_PORT,
                MAIL_SERVER=settings.MAIL_SERVER,
                MAIL_STARTTLS=settings.MAIL_STARTTLS,
                MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True,
                MAIL_FROM_NAME="강민성 한국사"
            )
            logger.info(f"[이메일 설정 완료] 서버: {settings.MAIL_SERVER}:{settings.MAIL_PORT}, FROM: {settings.MAIL_FROM or settings.MAIL_USERNAME}")
        except Exception as e:
            logger.error(f"[이메일 설정 생성 실패] {str(e)}")
            raise
    return _conf

async def send_signup_confirmation_email(email: str, nickname: str, confirm_link: str, expires_at) -> None:
    """회원가입 확정 안내 이메일 발송"""
    try:
        conf = get_email_config()
        if conf is None:
            logger.warning(f"이메일 설정이 없어 가입 인증 메일을 발송할 수 없습니다. (대상: {email})")
            return

        expires_text = (
            expires_at.astimezone().strftime("%Y-%m-%d %H:%M:%S")
            if hasattr(expires_at, "astimezone")
            else str(expires_at)
        )

        message = MessageSchema(
            subject="[강민성 한국사] 회원가입 이메일 인증 안내",
            recipients=[email],
            body=f"""
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; color: #1f2937; }}
    .container {{ max-width: 640px; margin: 0 auto; padding: 32px 24px; }}
    .header {{ text-align: center; margin-bottom: 32px; }}
    .header h1 {{ font-size: 24px; font-weight: 700; color: #1d4ed8; margin: 0; }}
    .content {{ background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }}
    .content h2 {{ margin-top: 0; font-size: 20px; color: #111827; }}
    .cta {{ display: inline-block; margin: 28px 0; padding: 14px 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff !important; text-decoration: none; border-radius: 9999px; font-weight: 700; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25); }}
    .cta:hover {{ background: linear-gradient(135deg, #1e40af, #1d4ed8); }}
    .info-box {{ background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 18px; margin-top: 24px; border-radius: 8px; font-size: 14px; color: #475569; }}
    .footer {{ margin-top: 48px; text-align: center; font-size: 12px; color: #9ca3af; }}
    .small {{ font-size: 13px; color: #6b7280; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>강민성 한국사</h1>
    </div>
    <div class="content">
      <h2>안녕하세요, {nickname or '회원님'} 님!</h2>
      <p class="small">회원가입을 완료하시려면 아래 버튼을 클릭해 이메일을 인증해주세요.</p>
      <div style="text-align: center;">
        <a href="{confirm_link}" class="cta" target="_blank" rel="noopener">가입 완료하기</a>
      </div>
      <p class="small">버튼이 동작하지 않는 경우 아래 링크를 복사해서 브라우저 주소창에 붙여넣어 주세요.</p>
      <p class="small" style="word-break: break-all; background: #f1f5f9; padding: 12px 14px; border-radius: 8px;">
        {confirm_link}
      </p>
      <div class="info-box">
        <strong>📌 안내사항</strong>
        <ul style="margin: 12px 0 0 16px; padding: 0;">
          <li>해당 링크는 {expires_text} 까지 유효합니다.</li>
          <li>제한시간이 지나면 다시 회원가입을 진행해야 합니다.</li>
          <li>본 메일이 잘못 발송되었다면 무시하셔도 됩니다.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      © {datetime.datetime.now().year} 강민성 한국사. All rights reserved.
    </div>
  </div>
</body>
</html>
            """,
            subtype="html",
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"[이메일 발송 성공] 가입 인증 링크 발송 완료: {email}")
    except Exception as e:
        logger.error(f"[이메일 발송 실패] 가입 인증 메일 전송 실패: {str(e)}")
        raise

async def send_welcome_email(email: str, nickname: str):
    """환영 이메일 발송"""
    try:
        conf = get_email_config()
        if conf is None:
            logger.warning(f"이메일 설정이 없어 환영 이메일을 발송할 수 없습니다. (대상: {email})")
            logger.warning("개발 환경에서는 이메일 발송을 건너뜁니다.")
            return True  # 개발 환경에서는 성공으로 처리
        
        message = MessageSchema(
            subject="강민성 한국사 회원가입을 환영합니다!",
            recipients=[email],
            body=f"""
안녕하세요. {nickname} 님!

회원가입을 환영합니다.

이제 사이트의 모든 서비스를 이용하실 수 있습니다.

감사합니다.
강민성 한국사 드림.
        """,
            subtype="plain"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"환영 이메일 발송 성공: {email}")
        return True
    except Exception as e:
        logger.error(f"환영 이메일 발송 실패: {str(e)}")
        raise e

async def send_password_reset_email(email: str, reset_link: str):
    """비밀번호 재설정 이메일 발송"""
    try:
        conf = get_email_config()
        if conf is None:
            logger.warning(f"이메일 설정이 없어 비밀번호 재설정 이메일을 발송할 수 없습니다. (대상: {email})")
            logger.warning("개발 환경에서는 이메일 발송을 건너뜁니다.")
            logger.warning(f"비밀번호 재설정 링크: {reset_link}")
            return True  # 개발 환경에서는 성공으로 처리
        
        message = MessageSchema(
            subject="[강민성 한국사] 비밀번호 재설정 안내",
            recipients=[email],
            body=f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Pretendard, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 30px 20px; }}
        .button {{ 
            display: inline-block; 
            background-color: #87ceeb; 
            color: #000000; 
            padding: 20px 40px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-weight: bold;
            font-size: 24px;
        }}
        .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        .warning {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>강민성 한국사</h2>
        </div>
        
        <div class="content">
            <h3>비밀번호 재설정 안내</h3>
            
            <p>안녕하세요. 강민성 한국사입니다.</p>
            
            <p>비밀번호 재설정 요청을 받았습니다.</p>
            
            <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>
            
            <br>
            <br>
            <div style="text-align: left;">
                <a href="{reset_link}" class="button" style="color: #000000 !important; font-size: 24px !important; font-weight: bold !important; padding: 20px 40px !important; background-color: #87ceeb !important;">비밀번호 재설정하기</a>
            </div>
            
            <br>
            <br>
            <div class="warning">
                <strong>⚠️ 주의사항:</strong>
                <ul>
                    <li>이 링크는 <strong>30분 후에 만료</strong>됩니다.</li>
                    <li>보안을 위해 이 링크는 <strong>한 번만 사용</strong>할 수 있습니다.</li>
                    <li>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해주세요.</li>
                </ul>
            </div>
            
            <p>링크가 작동하지 않는 경우, 아래 URL을 복사하여 브라우저에 붙여넣어 주세요:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 3px;">
                {reset_link}
            </p>
        </div>
        
        <br>
        <br>
        <div class="footer">
            <p>고맙습니다.<br>강민성 한국사 드림.</p>
        </div>

        <br>
        <br>
    </div>
</body>
</html>
            """,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"비밀번호 재설정 이메일 발송 성공: {email}")
        return True
    except Exception as e:
        logger.error(f"비밀번호 재설정 이메일 발송 실패: {str(e)}")
        raise e
