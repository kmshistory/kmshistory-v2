from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config import settings
import asyncio
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 이메일 설정 (구글 Gmail SMTP)
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    MAIL_FROM_NAME="강민성 한국사"  # 발신자 이름 추가
)

async def send_verification_email(email: str, verification_code: str):
    """이메일 인증 코드 발송"""
    try:
        message = MessageSchema(
            subject="[강민성 한국사] 이메일 인증 코드 안내",
            recipients=[email],
            body=f"""
안녕하세요. 강민성 한국사입니다.

회원가입을 위한 이메일 인증 코드입니다.

인증 코드: {verification_code}

이 코드는 3분 후에 만료됩니다.
정확한 코드를 입력해주세요.

고맙습니다.
강민성 한국사 드림.
            """,
            subtype="plain"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"인증 코드 발송 성공: {email}")
        return True
    except Exception as e:
        logger.error(f"이메일 발송 실패: {str(e)}")
        raise e

async def send_welcome_email(email: str, nickname: str):
    """환영 이메일 발송"""
    message = MessageSchema(
        subject="강민성 한국사 회원가입을 환영합니다!",
        recipients=[email],
        body=f"""
안녕하세요. {nickname}님!

강민성 한국사 회원가입을 환영합니다.

이제 강민성 한국사의 모든 서비스를 이용하실 수 있습니다.

감사합니다.
강민성 한국사
        """,
        subtype="plain"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_password_reset_email(email: str, reset_link: str):
    """비밀번호 재설정 이메일 발송"""
    try:
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
