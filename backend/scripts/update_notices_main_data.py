#!/usr/bin/env python3
"""
공지사항(notices) 1~5번의 생성일/발행일/조회수를 main DB에만 반영하는 스크립트.
staging 환경(.env.staging)에서는 실행되지 않습니다.
"""

import sys
import os
from datetime import datetime, timezone, timedelta

# 프로젝트 루트(backend)를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# main DB 전용: staging이면 즉시 종료
if os.getenv("ENV_FILE", "").strip() == ".env.staging":
    print("ERROR: This script applies only to the main database. Do not run with ENV_FILE=.env.staging.")
    sys.exit(1)

from app.database.connection import SessionLocal
from app.models import Notice

KST = timezone(timedelta(hours=9))

# id별 (created_at, published_at, views) — 모두 KST
NOTICES_MAIN_DATA = [
    (1, datetime(2024, 11, 6, 20, 30, 15, tzinfo=KST), 15),
    (2, datetime(2024, 11, 9, 20, 56, 15, tzinfo=KST), 23),
    (3, datetime(2025, 8, 11, 20, 0, 12, tzinfo=KST), 140),
    (4, datetime(2026, 1, 2, 23, 0, 13, tzinfo=KST), 121),
    (5, datetime(2026, 1, 2, 23, 4, 0, tzinfo=KST), 39),
]


def run():
    db = SessionLocal()
    try:
        for notice_id, dt, views in NOTICES_MAIN_DATA:
            notice = db.query(Notice).filter(Notice.id == notice_id).first()
            if not notice:
                print(f"Notice id={notice_id} not found, skipping.")
                continue
            notice.created_at = dt
            notice.published_at = dt
            notice.views = views
            notice.updated_at = datetime.now(KST)
            print(f"Updated notice id={notice_id}: created_at/published_at={dt.isoformat()}, views={views}")
        db.commit()
        print("Done. Main DB notices 1~5 updated.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
