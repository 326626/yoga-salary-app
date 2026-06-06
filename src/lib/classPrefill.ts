import type { CourseType, MemberPackage } from "@/types";

export type ClassPrefillQuery = {
  memberId?: string;
  packageId?: string;
  teacherId?: string;
  studioId?: string;
  courseType?: string;
  user_id?: string;
};

export type ClassPrefillForm = {
  member_id: string;
  package_id: string;
  teacher_id: string;
  studio_id?: string;
  course_type: CourseType | string;
  course_name: string;
};

const courseTypes: CourseType[] = ["group", "private", "trial", "substitute", "other"];

export function isCourseType(value: string | undefined): value is CourseType {
  return Boolean(value && courseTypes.includes(value as CourseType));
}

export function filterPackagesForMember(packages: MemberPackage[], memberId?: string) {
  return memberId ? packages.filter((item) => item.member_id === memberId) : packages;
}

export function derivePackageSelection(params: {
  packageId: string;
  packages: MemberPackage[];
  currentTeacherId: string;
  teacherTouched?: boolean;
}) {
  const selectedPackage = params.packages.find((item) => item.id === params.packageId);
  if (!selectedPackage) {
    return {};
  }

  return {
    member_id: selectedPackage.member_id,
    teacher_id: !params.teacherTouched && selectedPackage.teacher_id ? selectedPackage.teacher_id : params.currentTeacherId
  };
}

export function applyClassQueryPrefill<T extends ClassPrefillForm>(form: T, query: ClassPrefillQuery, packages: MemberPackage[]) {
  const next = { ...form };
  if (isCourseType(query.courseType)) {
    next.course_type = query.courseType;
    if (query.courseType === "private" && !next.course_name) {
      next.course_name = "私教课";
    }
  }
  if (query.memberId) {
    next.member_id = query.memberId;
  }
  if (query.teacherId) {
    next.teacher_id = query.teacherId;
  }
  if (query.packageId) {
    const selectedPackage = packages.find((item) => item.id === query.packageId);
    if (selectedPackage) {
      next.package_id = selectedPackage.id;
      next.member_id = selectedPackage.member_id;
      if (selectedPackage.teacher_id && !query.teacherId) {
        next.teacher_id = selectedPackage.teacher_id;
      }
    }
  }
  return next;
}
