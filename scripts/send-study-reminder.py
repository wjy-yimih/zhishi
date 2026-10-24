"""Read the exported public plan and send one daily email. No dependencies.

Default invocation is a credential-free dry run. Actual delivery requires
--send and three environment variables (Actions Secrets in the hosted flow).
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import html
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
import sys
from typing import Any
from urllib.parse import quote, urlsplit
from zoneinfo import ZoneInfo


SITE_URL = "https://wjy-yimih.github.io/zhishi/"
DEFAULT_PLAN = Path(__file__).resolve().parents[1] / "study-plan.json"
MAX_PLAN_BYTES = 2_000_000
ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,159}\Z")
MAIL_RE = re.compile(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?\.[A-Za-z]{2,63}\Z")


class PlanError(ValueError):
    """Safe, user-facing validation failure without secret values."""


def iso_date(value: Any) -> date:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise PlanError("计划中的日期必须是 YYYY-MM-DD。")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise PlanError("计划中存在无效日期。") from exc


def beijing_today(now: datetime | None = None) -> date:
    instant = now or datetime.now(timezone.utc)
    if instant.tzinfo is None:
        raise PlanError("内部时间必须包含时区。")
    return instant.astimezone(ZoneInfo("Asia/Shanghai")).date()


def clean_text(value: Any, field: str, max_length: int = 240) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > max_length:
        raise PlanError(f"计划中 {field} 内容为空或过长。")
    if any(ord(char) < 32 and char not in "\t" for char in value):
        raise PlanError(f"计划中 {field} 包含控制字符。")
    return value.strip()


def valid_id(value: Any) -> str:
    if not isinstance(value, str) or not ID_RE.fullmatch(value):
        raise PlanError("计划中存在无效课程标识。")
    if value in {"__proto__", "prototype", "constructor"}:
        raise PlanError("计划中存在保留标识。")
    return value


def validate_plan(raw: Any) -> dict:
    if not isinstance(raw, dict) or type(raw.get("version")) is not int or raw["version"] != 1:
        raise PlanError("请导出新版 study-plan.json，版本应为 1。")
    start, end = iso_date(raw.get("startDate")), iso_date(raw.get("endDate"))
    span = (end - start).days + 1
    if not 1 <= span <= 366:
        raise PlanError("计划日期范围必须在 1 至 366 天内。")
    rows = raw.get("lessons")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 2000:
        raise PlanError("邮件计划缺少 lessons 课程索引。请重新导出提醒计划。")
    lessons = {}
    for lesson in rows:
        if not isinstance(lesson, dict):
            raise PlanError("课程索引格式不正确。")
        identifier = valid_id(lesson.get("id"))
        if identifier in lessons:
            raise PlanError("课程索引中存在重复标识。")
        lessons[identifier] = {
            "id": identifier,
            "title": clean_text(lesson.get("title"), "知识点标题"),
            "courseTitle": clean_text(lesson.get("courseTitle"), "学科名称", 100),
        }
    days = raw.get("days")
    if not isinstance(days, list) or len(days) != span:
        raise PlanError("每天任务必须连续覆盖计划日期范围。")
    completed = raw.get("completedAtBuild", [])
    if not isinstance(completed, list) or len(completed) > len(lessons):
        raise PlanError("重排计划中的已完成知识点列表无效。")
    checked_completed = [valid_id(identifier) for identifier in completed]
    if len(set(checked_completed)) != len(checked_completed) or any(identifier not in lessons for identifier in checked_completed):
        raise PlanError("重排计划中的已完成知识点重复或不存在。")
    seen = set(checked_completed)
    normalized_days = []
    for offset, row in enumerate(days):
        if not isinstance(row, dict) or iso_date(row.get("date")) != start + timedelta(days=offset):
            raise PlanError("每天任务的日期不连续或顺序错误。")
        if type(row.get("index")) is not int or row["index"] != offset + 1:
            raise PlanError("每日任务编号必须从 1 连续递增。")
        if row.get("kind") not in {"study", "review"}:
            raise PlanError("每日任务类型必须为 study 或 review。")
        minutes = row.get("minutes")
        if type(minutes) not in {int, float} or not 0 <= minutes <= 10000:
            raise PlanError("每日预计学习时长无效。")
        checked = {}
        for field in ("lessonIds", "reviewIds"):
            values = row.get(field)
            if not isinstance(values, list) or len(values) > 2000 or len(set(map(str, values))) != len(values):
                raise PlanError("每日知识点列表无效或重复。")
            checked[field] = [valid_id(value) for value in values]
            if any(identifier not in lessons for identifier in checked[field]):
                raise PlanError("每日任务引用了课程索引中不存在的知识点。")
        if any(identifier in seen for identifier in checked["lessonIds"]):
            raise PlanError("不同日期重复安排了同一篇新课。")
        if any(identifier not in seen for identifier in checked["reviewIds"]):
            raise PlanError("复习任务应引用此前安排的新课。")
        seen.update(checked["lessonIds"])
        normalized_days.append({
            "date": row["date"], "index": row["index"], "kind": row["kind"],
            "minutes": minutes, **checked,
        })
    return {"version": 1, "startDate": start.isoformat(), "endDate": end.isoformat(),
            "days": normalized_days, "lessons": lessons}


def load_plan(path: Path) -> dict:
    try:
        if path.stat().st_size > MAX_PLAN_BYTES:
            raise PlanError("提醒计划文件过大，请重新导出。")
        return validate_plan(json.loads(path.read_text(encoding="utf-8-sig")))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PlanError("无法读取 study-plan.json，请把网页导出的提醒计划放回网站根目录并推送。") from exc


def day_for(plan: dict, target: date) -> dict | None:
    start, end = iso_date(plan["startDate"]), iso_date(plan["endDate"])
    if target < start or target > end:
        return None
    return plan["days"][(target - start).days]


def valid_site_url(value: str = SITE_URL) -> str:
    # This installation only links to the existing reviewed GitHub Pages site.
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or parsed.netloc != "wjy-yimih.github.io"
            or parsed.path != "/zhishi/" or parsed.query or parsed.fragment):
        raise PlanError("学习链接应使用现有知室的 HTTPS 网址。")
    return value


def lesson_url(identifier: str, site_url: str = SITE_URL) -> str:
    return valid_site_url(site_url) + "#/lesson/" + quote(valid_id(identifier), safe="")


def compose_content(plan: dict, day: dict, *, test: bool = False) -> tuple[str, str, str]:
    prefix = "【测试】" if test else ""
    kind = "复习与补漏" if day["kind"] == "review" else "今天学什么"
    subject = f"{prefix}知室 · 第{day['index']}天 · {kind}（{day['date']}）"
    heading = f"第 {day['index']} 天 · {day['date']} · {kind}"
    lines = [heading, f"计划：{plan['startDate']} 至 {plan['endDate']}（北京时间）",
             f"参考时长：约 {day['minutes']:g} 分钟；可拆成几次完成。", ""]
    fragments = []
    for key, title in (("lessonIds", "今天的新课"), ("reviewIds", "今天回想这些知识点")):
        ids = day[key]
        lines.append(title)
        entries = []
        for i, identifier in enumerate(ids, 1):
            lesson = plan["lessons"][identifier]
            label = f"{lesson['courseTitle']}｜{lesson['title']}"
            url = lesson_url(identifier)
            lines.extend([f"{i}. {label}", f"   {url}"])
            entries.append(f'<li><a href="{html.escape(url, quote=True)}">{html.escape(label)}</a></li>')
        if not ids:
            text = "今天留给整理笔记、补上前面未完成的任务。" if key == "lessonIds" else "合上讲解，口头说明今天的核心概念，再做对应自测。"
            lines.append(text)
            entries.append(f"<li>{text}</li>")
        fragments.append(f"<h2>{title}</h2><ol>{''.join(entries)}</ol>")
        lines.append("")
    advice = "先尝试回想，再看讲解核对；做不完先记录卡点，不必因一天落后放弃整个计划。"
    sync = "这封邮件使用仓库中最近导出的计划，不会自动读取手机或电脑的本地完成情况。重新排期后，请导出 study-plan.json 覆盖桌面同名文件，再提交并推送。"
    if test:
        lines.insert(1, "这是一封主动触发的测试邮件，不表示今天就是计划中的该日。")
    lines.extend([advice, "", f"打开两个月计划：{SITE_URL}#/planner", sync,
                  "计划结束后不再发送每日任务。停止提醒：GitHub → Actions → 知室每日学习邮件 → Disable workflow。"])
    test_notice = '<p style="color:#8c5a27">测试邮件：仅检查送达，日期以正文任务为准。</p>' if test else ""
    markup = f'''<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f6f7f2;color:#29342a;font-family:system-ui,sans-serif;line-height:1.8"><main style="max-width:660px;padding:28px 22px;margin:auto"><p style="letter-spacing:3px;color:#6a7b60">知室 / 每天学懂一点</p><h1 style="font-size:25px">{html.escape(heading)}</h1>{test_notice}<p>计划：{plan['startDate']} 至 {plan['endDate']}（北京时间）<br>参考时长：约 {day['minutes']:g} 分钟，可拆成几次完成。</p>{''.join(fragments)}<p>{advice}</p><p><a href="{SITE_URL}#/planner" style="color:#456336">打开两个月计划 →</a></p><hr style="border:0;border-top:1px solid #dce3d5"><p style="font-size:13px;color:#64705d">{sync}</p><p style="font-size:13px;color:#64705d">计划结束后停止发送每日任务。停止提醒：GitHub → Actions → 知室每日学习邮件 → Disable workflow。</p></main></body></html>'''
    return subject, "\n".join(lines), markup


def valid_mail(value: Any, field: str) -> str:
    if not isinstance(value, str) or len(value) > 254 or not MAIL_RE.fullmatch(value):
        raise PlanError(f"请在 Actions Secrets 配置有效的 {field} 邮箱地址。")
    return value


def smtp_config(env: dict | os._Environ = os.environ) -> dict:
    sender = valid_mail(env.get("SMTP_USER"), "SMTP_USER")
    recipient = valid_mail(env.get("STUDY_MAIL_TO"), "STUDY_MAIL_TO")
    password = env.get("SMTP_PASSWORD", "").replace(" ", "")
    if not password or len(password) > 256 or any(ord(char) < 32 for char in password):
        raise PlanError("请在 Actions Secrets 配置 SMTP_PASSWORD（邮箱授权码，不是网页登录密码）。")
    return {"sender": sender, "recipient": recipient, "password": password}


def send_message(plan: dict, day: dict, config: dict, *, test: bool = False) -> None:
    subject, plain, markup = compose_content(plan, day, test=test)
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"知室学习提醒 <{config['sender']}>"
    message["To"] = config["recipient"]
    message["Date"] = datetime.now(timezone.utc)
    signature = hashlib.sha256((plan["startDate"] + day["date"] + str(test)).encode()).hexdigest()[:24]
    message["Message-ID"] = f"<zhishi-{signature}@{config['sender'].split('@')[1]}>"
    message.set_content(plain)
    message.add_alternative(markup, subtype="html")
    # Gmail's implicit TLS endpoint; no insecure fallback or credential logging.
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context(), timeout=30) as smtp:
        smtp.login(config["sender"], config["password"])
        smtp.send_message(message)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", type=Path, default=DEFAULT_PLAN)
    parser.add_argument("--date", default="", help="仅 dry-run：预览 YYYY-MM-DD")
    parser.add_argument("--send", action="store_true", help="实际发送；默认只检查")
    parser.add_argument("--test", action="store_true", help="发送一封带测试标记的任务邮件")
    args = parser.parse_args(argv)
    if args.send and args.date:
        parser.error("实际发送不可覆盖日期；请使用 --test 测试送达。")
    if args.test and not args.send:
        parser.error("--test 必须与 --send 一起使用。")
    try:
        plan = load_plan(args.plan)
        today = beijing_today()
        target = iso_date(args.date) if args.date else today
        if args.test:
            target = min(max(today, iso_date(plan["startDate"])), iso_date(plan["endDate"]))
        day = day_for(plan, target)
        if day is None:
            print("今天不在计划日期范围内，未发送邮件。")
            return 0
        subject, plain, _ = compose_content(plan, day, test=args.test)
        if not args.send:
            print("DRY RUN：仅检查计划和邮件正文，未连接邮箱，未发送。")
            print(subject)
            print(plain)
            return 0
        config = smtp_config()
        send_message(plan, day, config, test=args.test)
        print(f"{'测试' if args.test else '今日'}任务邮件已发送（第 {day['index']} 天）。")
        return 0
    except PlanError as exc:
        print(f"提醒未发送：{exc}", file=sys.stderr)
    except smtplib.SMTPAuthenticationError:
        print("提醒未发送：邮箱认证失败。请检查 Gmail 两步验证与应用专用密码。", file=sys.stderr)
    except (smtplib.SMTPException, OSError):
        print("提醒未发送：邮箱连接或投递失败。请稍后到 Actions 查看并手动重试。", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
