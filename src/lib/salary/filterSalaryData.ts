import type { ClassRecord, MemberPackage, Performance } from "@/types";

export function filterSalaryData(params: {
  classes: ClassRecord[];
  performances: Performance[];
  packages: MemberPackage[];
  studioId?: string;
}) {
  if (!params.studioId) {
    return {
      classes: params.classes,
      performances: params.performances,
      packages: params.packages
    };
  }

  const classes = params.classes.filter((item) => item.studio_id === params.studioId);
  const performances = params.performances.filter((item) => item.studio_id === params.studioId);
  const referencedPackageIds = new Set([
    ...classes.map((item) => item.package_id).filter(Boolean),
    ...performances.map((item) => item.package_id).filter(Boolean)
  ]);
  const packages = params.packages.filter((item) => item.studio_id === params.studioId || referencedPackageIds.has(item.id));

  return { classes, performances, packages };
}
