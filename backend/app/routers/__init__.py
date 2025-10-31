# ===============================
# 📦 Routers package initializer
# ===============================

# ✅ Admin (BackOffice)
from .admin import (
    admin_faq_api_router,
    admin_faq_template_router,
    admin_notice_api_router,
    admin_notice_template_router,
    admin_setting_api_router,
    dashboard_api_router,
    dashboard_template_router,
    file_api_router,
    file_template_router,
    notification_api_router,
    notification_template_router,
    terms_api_router,
    terms_template_router,
    user_admin_api_router,
    user_admin_template_router,
    draw_api_router,
    draw_template_router,
    participant_api_router,
    participant_template_router,
    calendar_api_router,
    calendar_template_router,
)

# ✅ Auth & User (공통)
from . import (
    auth_api_router,
    auth_template_router,
    mypage_api_router,
    mypage_template_router,
    user_member_api_router,
    user_member_template_router,
    seo_router,
)

# ✅ Client (일반 사용자)
from .client import (
    client_home_router,
    client_notice_router,
)

# ✅ Public Home (루트 경로용)
from . import (
    home_api_router,
    home_template_router,
)

# ===============================
# 🔗 Export
# ===============================
__all__ = [
    # Admin
    "admin_faq_api_router",
    "admin_faq_template_router",
    "admin_notice_api_router",
    "admin_notice_template_router",
    "admin_setting_api_router",
    "dashboard_api_router",
    "dashboard_template_router",
    "file_api_router",
    "file_template_router",
    "notification_api_router",
    "notification_template_router",
    "terms_api_router",
    "terms_template_router",
    "user_admin_api_router",
    "user_admin_template_router",
    "draw_api_router",
    "draw_template_router",
    "participant_api_router",
    "participant_template_router",
    "calendar_api_router",
    "calendar_template_router",

    # Auth & User
    "auth_api_router",
    "auth_template_router",
    "mypage_api_router",
    "mypage_template_router",
    "user_member_api_router",
    "user_member_template_router",

    # Client
    "client_home_router",
    "client_notice_router",
    "seo_router",

    # Public
    "home_api_router",
    "home_template_router",
]
