# app/routers/client/seo_router.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Notice, FAQ
import re
import logging

router = APIRouter(tags=["Client:SEO"])
logger = logging.getLogger(__name__)

@router.get("/sitemap.xml")
async def generate_sitemap(db: Session = Depends(get_db)):
    """사이트맵 XML 생성 (검색엔진용)"""
    try:
        base_url = settings.FRONTEND_URL

        urls = [
            {"loc": f"{base_url}/", "priority": "1.0", "changefreq": "daily"},
            {"loc": f"{base_url}/client/notice", "priority": "0.9", "changefreq": "daily"},
            {"loc": f"{base_url}/client/faq", "priority": "0.8", "changefreq": "weekly"},
        ]

        # 공지사항
        notices = db.query(Notice).filter(Notice.is_deleted == False, Notice.publish_status == "published").all()
        for n in notices:
            urls.append({
                "loc": f"{base_url}/client/notice/{n.id}",
                "lastmod": n.updated_at or n.created_at,
                "priority": "0.7",
                "changefreq": "weekly"
            })

        # FAQ
        faqs = db.query(FAQ).filter(FAQ.is_active == True).all()
        for f in faqs:
            urls.append({
                "loc": f"{base_url}/client/faq/{f.id}",
                "lastmod": f.updated_at or f.created_at,
                "priority": "0.6",
                "changefreq": "monthly"
            })

        xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for u in urls:
            xml.append("  <url>")
            xml.append(f"    <loc>{u['loc']}</loc>")
            if "lastmod" in u:
                xml.append(f"    <lastmod>{u['lastmod'].strftime('%Y-%m-%d')}</lastmod>")
            xml.append(f"    <changefreq>{u['changefreq']}</changefreq>")
            xml.append(f"    <priority>{u['priority']}</priority>")
            xml.append("  </url>")
        xml.append("</urlset>")

        return HTMLResponse(content="\n".join(xml), media_type="application/xml")

    except Exception as e:
        logger.error(f"사이트맵 생성 실패: {e}")
        raise HTTPException(500, "사이트맵 생성 실패")


@router.get("/rss.xml")
async def generate_rss(db: Session = Depends(get_db)):
    """RSS 피드 생성"""
    try:
        base_url = settings.FRONTEND_URL
        notices = db.query(Notice).filter(Notice.is_deleted == False, Notice.publish_status == "published").order_by(Notice.created_at.desc()).limit(20).all()

        rss = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0">',
            '  <channel>',
            '    <title>강민성 한국사 - 공지사항</title>',
            f'    <link>{base_url}/client/notice</link>',
            '    <description>최신 공지사항과 소식</description>',
        ]

        for n in notices:
            description = re.sub('<[^<]+?>', '', n.content)[:200]
            rss.append('    <item>')
            rss.append(f'      <title><![CDATA[{n.title}]]></title>')
            rss.append(f'      <link>{base_url}/client/notice/{n.id}</link>')
            rss.append(f'      <description><![CDATA[{description}]]></description>')
            rss.append(f'      <pubDate>{n.created_at.strftime("%a, %d %b %Y %H:%M:%S +0900")}</pubDate>')
            rss.append('    </item>')

        rss.append('  </channel>')
        rss.append('</rss>')

        return HTMLResponse(content="\n".join(rss), media_type="application/xml")

    except Exception as e:
        logger.error(f"RSS 생성 실패: {e}")
        raise HTTPException(500, "RSS 생성 실패")


@router.get("/robots.txt")
async def robots_txt():
    """robots.txt 생성"""
    base_url = settings.FRONTEND_URL
    content = f"""User-agent: *
Allow: /
Disallow: /admin/
Disallow: /backoffice/
Disallow: /api/admin/
Sitemap: {base_url}/sitemap.xml
"""
    return HTMLResponse(content=content, media_type="text/plain")
