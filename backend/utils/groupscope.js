const Department = require("../models/Department");
const User = require("../models/User");

/**
 * Central place that decides what a Team Lead is allowed to see.
 *
 *  - Department WITHOUT groups  -> unchanged: the whole department
 *  - Department WITH groups     -> only the employees of the Team Lead's own group
 *
 * IMPORTANT: always combine these scopes with the request's own filters via
 *   { $and: [scope, filters] }
 * and never spread/overwrite them. Otherwise a query param such as
 * ?employee=<someone from the other group> could replace the scope and leak data.
 */

async function departmentUsesGroups(departmentId) {
  if (!departmentId) return false;
  const dept = await Department.findById(departmentId).select("hasGroups");
  return !!dept?.hasGroups;
}

// Mongo filter for Report queries
async function teamLeadReportScope(tl) {
  const base = { department: tl.department };
  if (!(await departmentUsesGroups(tl.department))) return base;

  // a Team Lead who hasn't been given a group yet sees nothing
  if (!tl.team) return { ...base, employee: { $in: [] } };

  const members = await User.find({
    role: "employee",
    department: tl.department,
    team: tl.team,
  }).select("_id");
  return { ...base, employee: { $in: members.map((m) => m._id) } };
}

// Mongo filter for User queries (user lists, task assignee pickers)
async function teamLeadUserScope(tl) {
  const base = { department: tl.department };
  if (!(await departmentUsesGroups(tl.department))) return base;
  if (!tl.team) return { ...base, _id: { $in: [] } };
  return { ...base, team: tl.team, role: "employee" };
}

// Single-user check, e.g. "may this Team Lead act on this report's author?"
async function teamLeadCanAccessUser(tl, target) {
  if (!target || String(target.department) !== String(tl.department)) return false;
  if (!(await departmentUsesGroups(tl.department))) return true;
  return (
    target.role === "employee" && !!tl.team && String(target.team) === String(tl.team)
  );
}

// Merges filters so that ALL of them apply (intersection). Use this to combine
// a scope with request-driven filters instead of spreading them together.
function andFilters(...filters) {
  const parts = filters.filter((f) => f && Object.keys(f).length > 0);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

module.exports = {
  andFilters,
  departmentUsesGroups,
  teamLeadReportScope,
  teamLeadUserScope,
  teamLeadCanAccessUser,
};