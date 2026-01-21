# app/services/draw_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import or_
from datetime import datetime
from app.models import DrawRecord, DrawParticipant, Participant, Notification

def list_draw_records(db: Session, search: str | None, page: int, limit: int):
    """관리자 - 추첨 기록 목록 조회"""
    query = db.query(DrawRecord)
    if search:
        query = query.filter(
            or_(
                DrawRecord.title.contains(search),
                DrawRecord.content.contains(search)
            )
        )
    total = query.count()
    records = query.order_by(DrawRecord.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return records, total


def get_draw_detail(db: Session, draw_id: int):
    """관리자 - 추첨 상세"""
    draw = db.query(DrawRecord).filter(DrawRecord.id == draw_id).first()
    if not draw:
        raise HTTPException(404, "추첨 기록을 찾을 수 없습니다.")
    participants = db.query(DrawParticipant).filter(
        DrawParticipant.draw_record_id == draw_id
    ).order_by(DrawParticipant.participant_number).all()
    return draw, participants


def delete_draw(db: Session, draw_id: int):
    """추첨 기록 삭제"""
    record = db.query(DrawRecord).filter(DrawRecord.id == draw_id).first()
    if not record:
        raise HTTPException(404, "추첨 기록을 찾을 수 없습니다.")
    db.delete(record)
    db.commit()
    return {"message": "추첨 기록이 삭제되었습니다."}


def save_draw_result(db: Session, data: dict, current_user):
    """추첨 결과 저장"""
    title = data.get("title")
    content = data.get("content", "")
    draw_datetime_str = data.get("draw_datetime")
    total_participants = data.get("total_participants")
    winner_count = data.get("winner_count")
    winners = data.get("winners", [])
    upload_file_id = data.get("upload_file_id")

    if not title:
        raise HTTPException(400, "추첨 제목은 필수입니다.")
    if not draw_datetime_str:
        raise HTTPException(400, "추첨일시는 필수입니다.")

    try:
        draw_datetime = datetime.fromisoformat(draw_datetime_str.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "올바른 날짜 형식이 아닙니다.")

    # 추첨 기록 생성
    record = DrawRecord(
        title=title,
        content=content,
        draw_datetime=draw_datetime,
        total_participants=total_participants or len(winners),
        winner_count=winner_count or len(winners),
        upload_file_id=upload_file_id
    )
    db.add(record)
    db.flush()

    # 전체 대상자 조회
    participants = db.query(Participant).all()
    for i, p in enumerate(participants):
        is_winner = any(
            w["name"] == p.name and w["email"] == p.email
            for w in winners
        )
        dp = DrawParticipant(
            draw_record_id=record.id,
            participant_number=i + 1,
            name=p.name,
            email=p.email,
            description=p.description,
            is_winner=is_winner
        )
        db.add(dp)

    # 알림 생성
    notification = Notification(
        type="draw_saved",
        title=f"추첨 결과가 저장되었습니다: {title}",
        content=f"총 {record.total_participants}명 중 {record.winner_count}명 당첨",
        related_id=record.id
    )
    db.add(notification)
    db.commit()
    db.refresh(record)

    return {"message": "추첨 결과 저장 완료", "draw_id": record.id}
