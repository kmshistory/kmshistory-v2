"""
Jinja2 Templates 설정
"""
from fastapi.templating import Jinja2Templates
import os

# 템플릿 디렉토리 경로 (backend/templates)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

# 템플릿 디렉토리가 없으면 생성
os.makedirs(TEMPLATE_DIR, exist_ok=True)

# Jinja2 템플릿 인스턴스 생성
templates = Jinja2Templates(directory=TEMPLATE_DIR)





