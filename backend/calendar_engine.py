"""
calendar_engine.py
──────────────────
Rule-driven compliance calendar engine for NBFC reporting.

Core function:  calculate_due_date(rule, as_of)
Inputs:         rule dict (from compliance_rules.json) + reference date
Output:         (due_date, period_end, period_label, computation_trace)

Rule types supported:
  month_end    → due = last_completed_month_end(as_of)  + offset_days
  quarter_end  → due = last_completed_quarter_end(as_of) + offset_days
  fy_end       → due = last_completed_fy_end(as_of)      + offset_days
  fixed_date   → due = date(year, fixed_month, fixed_day)  [no offset]
  event        → "On Occurrence" — no computation

Status is always computed, never stored:
  delta < 0     → OVERDUE
  0 ≤ delta ≤ 7 → DUE SOON
  delta > 7     → UPCOMING
"""

from datetime import date, timedelta
import calendar as _cal


# ── Period-end helpers ────────────────────────────────────────────────────────

def last_completed_month_end(as_of: date) -> date:
    """Last day of the previous month."""
    return as_of.replace(day=1) - timedelta(days=1)


def last_completed_quarter_end(as_of: date) -> date:
    """
    Indian FY quarter ends: Q1=Jun30, Q2=Sep30, Q3=Dec31, Q4=Mar31.
    Returns the most recently completed quarter end strictly before as_of.
    """
    year = as_of.year
    candidates = [
        date(year - 1, 9, 30),
        date(year - 1, 12, 31),
        date(year, 3, 31),
        date(year, 6, 30),
        date(year, 9, 30),
        date(year, 12, 31),
    ]
    return max(d for d in candidates if d < as_of)


def last_completed_fy_end(as_of: date) -> date:
    """
    Indian financial year ends 31 March.
    Returns the most recently completed 31 March strictly before as_of.
    """
    mar31_this_year = date(as_of.year, 3, 31)
    if as_of > mar31_this_year:
        return mar31_this_year
    return date(as_of.year - 1, 3, 31)


# ── Period label ──────────────────────────────────────────────────────────────

def _period_label(rule_type: str, period_end: date) -> str:
    if rule_type == "month_end":
        return period_end.strftime("%b %Y")
    if rule_type == "quarter_end":
        m, y = period_end.month, period_end.year
        if m == 3:   return f"Q4 FY{y-1}-{str(y)[2:]}"
        if m == 6:   return f"Q1 FY{y}-{str(y+1)[2:]}"
        if m == 9:   return f"Q2 FY{y}-{str(y+1)[2:]}"
        if m == 12:  return f"Q3 FY{y}-{str(y+1)[2:]}"
    if rule_type == "fy_end":
        y = period_end.year
        return f"FY{y-1}-{str(y)[2:]}"
    return "On occurrence"


# ── Core: calculate_due_date ──────────────────────────────────────────────────

def calculate_due_date(rule: dict, as_of: date = None) -> dict:
    """
    For a single rule, calculates the due date and returns a full audit trace.

    Returns:
      due_date        : ISO date string (or None for event-based)
      period_end      : ISO date string of the reference period end
      period_label    : Human-readable period (e.g. "Q4 FY2025-26", "May 2026")
      computation     : Full trace string showing exactly how the date was derived
      status          : OVERDUE | DUE SOON | UPCOMING | ON OCCURRENCE
      days_delta      : Integer days from as_of to due_date
    """
    if as_of is None:
        as_of = date.today()

    rule_type   = rule.get("rule_type", "month_end")
    offset      = rule.get("offset_days", 0)
    due_basis   = rule.get("due_basis", "")

    # ── EVENT-BASED ──────────────────────────────────────────────────────────
    if rule_type == "event":
        return {
            "due_date":     None,
            "period_end":   None,
            "period_label": "On occurrence",
            "computation":  "No fixed schedule — due immediately on occurrence of triggering event",
            "status":       "ON OCCURRENCE",
            "days_delta":   None,
        }

    # ── FIXED DATE ───────────────────────────────────────────────────────────
    if rule_type == "fixed_date":
        fm = rule.get("fixed_month", 3)
        fd = rule.get("fixed_day", 31)
        d = date(as_of.year, fm, fd)
        if d < as_of:
            d = date(as_of.year + 1, fm, fd)
        delta  = (d - as_of).days
        status = "DUE SOON" if delta <= 7 else "UPCOMING"
        return {
            "due_date":     d.isoformat(),
            "period_end":   d.isoformat(),
            "period_label": d.strftime("%d %b %Y"),
            "computation":  f"Fixed date: {d.strftime('%d %B')} each year",
            "status":       status,
            "days_delta":   delta,
        }

    # ── PERIODIC (month_end / quarter_end / fy_end) ──────────────────────────
    if rule_type == "month_end":
        period_end = last_completed_month_end(as_of)
    elif rule_type == "quarter_end":
        period_end = last_completed_quarter_end(as_of)
    elif rule_type == "fy_end":
        period_end = last_completed_fy_end(as_of)
    else:
        period_end = last_completed_month_end(as_of)

    due    = period_end + timedelta(days=offset)
    delta  = (due - as_of).days
    label  = _period_label(rule_type, period_end)

    if delta < 0:
        status = "OVERDUE"
    elif delta <= 7:
        status = "DUE SOON"
    else:
        status = "UPCOMING"

    computation = (
        f"Period end: {period_end.strftime('%d %b %Y')}  +  {offset} days  =  {due.strftime('%d %b %Y')}"
        f"\nBasis: {due_basis}"
    )

    return {
        "due_date":     due.isoformat(),
        "period_end":   period_end.isoformat(),
        "period_label": label,
        "computation":  computation,
        "status":       status,
        "days_delta":   delta,
    }


# ── Recipient resolver ────────────────────────────────────────────────────────

def resolve_recipient(rule: dict, nbfc_regional_office: str) -> str:
    """Returns the specific body this return is filed with."""
    rtype = rule.get("recipient_type", "Central Portal")
    if rtype == "RBI Regional Office":
        return f"RBI {nbfc_regional_office} Regional Office"
    if rtype == "External Regulator":
        return rule.get("regulator", "External Regulator")
    return rule.get("submission_portal", "RBI Portal")


# ── Full calendar builder ─────────────────────────────────────────────────────

def build_compliance_calendar(nbfc: dict, all_rules: list, as_of: date = None) -> list:
    """
    Builds the full compliance calendar for an NBFC.
    Returns entries sorted: OVERDUE → DUE SOON → UPCOMING → ON OCCURRENCE.
    """
    if as_of is None:
        as_of = date.today()

    classification = nbfc.get("classification", "")
    layer          = nbfc.get("layer", "")
    regional_office = nbfc.get("regional_office", "")

    ORDER = {"OVERDUE": 0, "DUE SOON": 1, "UPCOMING": 2, "ON OCCURRENCE": 3}

    entries = []
    for rule in all_rules:
        if (classification not in rule.get("applicable_classification", [])):
            continue
        if (layer not in rule.get("applicable_layer", [])):
            continue

        due_info   = calculate_due_date(rule, as_of)
        recipient  = resolve_recipient(rule, regional_office)

        entries.append({
            "rule_id":        rule["id"],
            "return_name":    rule["return_name"],
            "frequency":      rule["frequency"],
            "rule_type":      rule.get("rule_type"),
            "offset_days":    rule.get("offset_days"),
            "due_basis":      rule.get("due_basis"),
            "period_label":   due_info["period_label"],
            "due_date":       due_info["due_date"],
            "period_end":     due_info["period_end"],
            "computation":    due_info["computation"],
            "days_delta":     due_info["days_delta"],
            "status":         due_info["status"],
            "reports_to":     recipient,
            "recipient_type": rule.get("recipient_type", "Central Portal"),
            "portal_name":    rule["submission_portal"],
            "portal_url":     rule["portal_url"],
            "regulator":      rule["regulator"],
            "legal_source":   rule["legal_source"],
            "clause":         rule["clause"],
        })

    entries.sort(key=lambda x: (ORDER.get(x["status"], 4), x["due_date"] or ""))
    return entries
