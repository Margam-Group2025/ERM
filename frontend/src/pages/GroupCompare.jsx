
const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

const dayKey = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  // Use the report's local calendar date instead of UTC conversion.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Arrange Team Leader reports into comparison cards.
 * One card per report date and report type, with one slot per group.
 */
export function buildComparisonCards(reports = [], teams = []) {
  const teamIds = new Set(teams.map((team) => getId(team)).filter(Boolean));

  const cards = new Map();
  const unplaced = [];

  for (const report of reports) {
    // The API may return team directly as an ID, populated object,
    // or older reports may only have employee.team.
    const teamId = getId(report.team || report.teamId) ||
      getId(report.employee?.team);

    if (!teamId || !teamIds.has(teamId)) {
      unplaced.push(report);
      continue;
    }

    const date = dayKey(
      report.reportDate || report.createdAt || report.submittedAt
    );

    if (!date) {
      unplaced.push(report);
      continue;
    }

    const reportType = report.reportType || "daily";
    const key = `${date}|${reportType}`;

    if (!cards.has(key)) {
      cards.set(key, {
        key,
        dateKey: date,
        reportType,
        byTeam: {},
      });
    }

    const card = cards.get(key);

    const slot =
      card.byTeam[teamId] ||
      (card.byTeam[teamId] = {
        latest: report,
        count: 0,
      });

    slot.count += 1;

    const currentTime = new Date(
      report.createdAt || report.submittedAt || report.reportDate || 0
    ).getTime();

    const latestTime = new Date(
      slot.latest.createdAt ||
        slot.latest.submittedAt ||
        slot.latest.reportDate ||
        0
    ).getTime();

    if (currentTime > latestTime) {
      slot.latest = report;
    }
  }

  const list = [...cards.values()].sort(
    (a, b) =>
      b.dateKey.localeCompare(a.dateKey) ||
      a.reportType.localeCompare(b.reportType)
  );

  return { cards: list, unplaced };
}

/**
 * Get all report fields in template order, using human-readable labels.
 */
export function fieldRows(reports = []) {
  const rows = [];
  const seen = new Set();

  const add = (key, label) => {
    if (seen.has(key)) return;

    seen.add(key);
    rows.push({ key, label });
  };

  for (const report of reports) {
    const fields = [...(report.reportTemplate?.fields || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    fields.forEach((field) => {
      if (
        report.data &&
        Object.prototype.hasOwnProperty.call(report.data, field.key)
      ) {
        add(field.key, field.label || field.key);
      }
    });
  }

  // Include fields from older reports that may not have a template.
  for (const report of reports) {
    Object.keys(report.data || {}).forEach((key) => {
      add(key, key.replace(/_/g, " "));
    });
  }

  return rows;
}
