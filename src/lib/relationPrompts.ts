export type RelationCounts = {
  classes?: number;
  performances?: number;
  packages?: number;
  salaryRules?: number;
};

function hasRelations(counts: RelationCounts) {
  return Object.values(counts).some((value) => (value ?? 0) > 0);
}

export function getMemberDeletePrompt(counts: RelationCounts) {
  return hasRelations(counts)
    ? "这个会员还有课包或记录，删除后可能影响工资明细。确定删除吗？"
    : "确定删除这位会员吗？";
}

export function getPackageDeletePrompt(counts: RelationCounts) {
  return hasRelations(counts)
    ? "这个课包已有课程或业绩记录，删除后相关记录可能无法显示课包信息。确定删除吗？"
    : "确定删除这个课包吗？";
}

export function getTeacherDeletePrompt(counts: RelationCounts) {
  return hasRelations(counts)
    ? "这个老师已有相关记录，删除后可能影响历史数据。确定删除吗？"
    : "确定删除这个老师档案吗？";
}
