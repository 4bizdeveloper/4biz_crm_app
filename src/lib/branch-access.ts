export type BranchAccessContext = {
  isAdmin: boolean;
  branch: string | null;
};

/**
 * Branch scoping is enforced when an employee has an authoritative branch assignment.
 * Legacy employees with a null branch remain on assignment-based access until branch data is populated.
 */
export function canAccessLeadBranch(ctx: BranchAccessContext, leadBranch?: string | null) {
  return ctx.isAdmin || !ctx.branch || leadBranch === ctx.branch;
}
