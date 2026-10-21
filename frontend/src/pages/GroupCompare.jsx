
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Arranges Team Leader reports into comparison cards: ONE card per
 * (report date, report type), with one slot per group.
 *
 * reports: Team Leader reports, each with employee.team._id
 * teams:   the department's groups (these become the columns)
 *
 * If a Team Leader submitted more than once for the same date and type, the
 * latest submission is shown and `count` records how many there were.
 * Reports from Team Leaders who aren't in any of these groups can't be placed
 * in a column — they come back as `unplaced`.
 */
export function buildComparisonCards(reports, teams) {
  const teamIds = new Set(teams.map((t) => t._id));
  const cards = new Map();
  const unplaced = [];

  for (const r of reports) {
    const teamId = r.employee?.team?._id;
    if (!teamId || !teamIds.has(teamId)) {
      unplaced.push(r);
      continue;
    }

    const date = dayKey(r.reportDate);
    const key = `${date}|${r.reportType}`;
    if (!cards.has(key)) {
      cards.set(key, { key, dateKey: date, reportType: r.reportType, byTeam: {} });
    }

    const card = cards.get(key);
    const slot = card.byTeam[teamId] || (card.byTeam[teamId] = { latest: r, count: 0 });
    slot.count += 1;
    if (new Date(r.createdAt) > new Date(slot.latest.createdAt)) slot.latest = r;
  }

  const list = [...cards.values()].sort(
    (a, b) => b.dateKey.localeCompare(a.dateKey) || a.reportType.localeCompare(b.reportType)
  );
  return { cards: list, unplaced };
}

/**
 * The rows of one card: every field that appears in ANY of its reports, in
 * template order, with the human label from the template. Both Team Leaders
 * normally use the same template, so the rows line up one-to-one.
 */
export function fieldRows(reports) {
  const rows = [];
  const seen = new Set();
  const add = (key, label) => {
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ key, label });
  };

  for (const r of reports) {
    const fields = [...(r.reportTemplate?.fields || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    fields.forEach((f) => {
      if (r.data && Object.prototype.hasOwnProperty.call(r.data, f.key)) add(f.key, f.label);
    });
  }
  // anything left over (very old reports without a template): tidy up the key
  for (const r of reports) {
    Object.keys(r.data || {}).forEach((key) => add(key, key.replace(/_/g, " ")));
  }
  return rows;
}