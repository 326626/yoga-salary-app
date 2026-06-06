import type {
  ClassRecord,
  Member,
  MemberPackage,
  Performance,
  SalaryCalculation,
  SalaryRule,
  Studio,
  Teacher
} from "@/types";

export const mockUserId = "11111111-1111-4111-8111-111111111111";
export const mockCreatedAt = "2026-06-01T00:00:00.000Z";

export const mockTeachers: Teacher[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    user_id: mockUserId,
    name: "张老师",
    phone: "13800000001",
    note: "主带流瑜伽和私教",
    created_at: mockCreatedAt
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    user_id: mockUserId,
    name: "王老师",
    phone: "13800000002",
    note: "主带普拉提和代课",
    created_at: mockCreatedAt
  }
];

export const mockStudios: Studio[] = [
  {
    id: "99999999-9999-4999-8999-999999999901",
    user_id: mockUserId,
    name: "禅悦瑜伽馆",
    phone: "021-88880001",
    address: "静安区瑜伽路 88 号",
    contact_name: "店长 Anna",
    note: "常去上团课和私教的场地",
    created_at: mockCreatedAt
  },
  {
    id: "99999999-9999-4999-8999-999999999902",
    user_id: mockUserId,
    name: "私教上门",
    phone: null,
    address: null,
    contact_name: null,
    note: "上门私教和临时场地",
    created_at: mockCreatedAt
  }
];

export const mockMembers: Member[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    user_id: mockUserId,
    name: "李女士",
    phone: "13900000001",
    note: "300 元/节私教课包",
    created_at: mockCreatedAt
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    user_id: mockUserId,
    name: "陈先生",
    phone: "13900000002",
    note: "500 元/节私教课包",
    created_at: mockCreatedAt
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    user_id: mockUserId,
    name: "赵女士",
    phone: "13900000003",
    note: "团课月卡会员",
    created_at: mockCreatedAt
  }
];

export const mockPackages: MemberPackage[] = [
  {
    id: "44444444-4444-4444-8444-444444444401",
    user_id: mockUserId,
    member_id: mockMembers[0].id,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    package_name: "私教 10 节",
    course_type: "private",
    total_amount: 3000,
    total_sessions: 10,
    unit_price: 300,
    purchase_date: "2026-06-01",
    note: "用于测试 300 元单节成交价",
    created_at: mockCreatedAt
  },
  {
    id: "44444444-4444-4444-8444-444444444402",
    user_id: mockUserId,
    member_id: mockMembers[1].id,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    package_name: "私教 10 节",
    course_type: "private",
    total_amount: 5000,
    total_sessions: 10,
    unit_price: 500,
    purchase_date: "2026-06-02",
    note: "用于测试 500 元单节成交价",
    created_at: mockCreatedAt
  },
  {
    id: "44444444-4444-4444-8444-444444444403",
    user_id: mockUserId,
    member_id: mockMembers[2].id,
    teacher_id: null,
    studio_id: mockStudios[0].id,
    package_name: "团课月卡",
    course_type: "group",
    total_amount: 899,
    total_sessions: 30,
    unit_price: 29.9666666667,
    purchase_date: "2026-06-03",
    note: "团课月卡场景",
    created_at: mockCreatedAt
  }
];

export const mockClasses: ClassRecord[] = [
  {
    id: "55555555-5555-4555-8555-555555555501",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: null,
    package_id: null,
    date: "2026-06-04",
    course_name: "晨间流瑜伽",
    course_type: "group",
    student_count: 12,
    hours: 1,
    manual_fee: null,
    note: "团课固定课时费",
    created_at: mockCreatedAt
  },
  {
    id: "55555555-5555-4555-8555-555555555502",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[0].id,
    package_id: mockPackages[0].id,
    date: "2026-06-05",
    course_name: "李女士私教体态调整",
    course_type: "private",
    student_count: 1,
    hours: 1,
    manual_fee: null,
    note: "关联 300 元/节课包",
    created_at: mockCreatedAt
  },
  {
    id: "55555555-5555-4555-8555-555555555503",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[1].id,
    package_id: mockPackages[1].id,
    date: "2026-06-06",
    course_name: "陈先生私教精准拉伸",
    course_type: "private",
    student_count: 1,
    hours: 1,
    manual_fee: null,
    note: "关联 500 元/节课包",
    created_at: mockCreatedAt
  },
  {
    id: "55555555-5555-4555-8555-555555555504",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[2].id,
    package_id: null,
    date: "2026-06-07",
    course_name: "缺少课包的私教补录",
    course_type: "private",
    student_count: 1,
    hours: 1,
    manual_fee: null,
    note: "故意缺少 package_id，用于工资计算 warning",
    created_at: mockCreatedAt
  },
  {
    id: "55555555-5555-4555-8555-555555555505",
    user_id: mockUserId,
    teacher_id: mockTeachers[1].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[2].id,
    package_id: null,
    date: "2026-06-08",
    course_name: "新人体验课",
    course_type: "trial",
    student_count: 1,
    hours: 1,
    manual_fee: null,
    note: "体验课不计课时费",
    created_at: mockCreatedAt
  },
  {
    id: "55555555-5555-4555-8555-555555555506",
    user_id: mockUserId,
    teacher_id: mockTeachers[1].id,
    studio_id: mockStudios[0].id,
    member_id: null,
    package_id: null,
    date: "2026-06-09",
    course_name: "晚间哈他代课",
    course_type: "substitute",
    student_count: 10,
    hours: 1,
    manual_fee: null,
    note: "代课固定课时费",
    created_at: mockCreatedAt
  }
];

export const mockPerformances: Performance[] = [
  {
    id: "66666666-6666-4666-8666-666666666601",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[0].id,
    package_id: mockPackages[0].id,
    date: "2026-06-01",
    customer_name: "李女士",
    type: "new_card",
    amount: 3000,
    commissionable: true,
    note: "新办卡",
    created_at: mockCreatedAt
  },
  {
    id: "66666666-6666-4666-8666-666666666602",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[2].id,
    package_id: mockPackages[2].id,
    date: "2026-06-03",
    customer_name: "赵女士",
    type: "renewal",
    amount: 899,
    commissionable: true,
    note: "续费",
    created_at: mockCreatedAt
  },
  {
    id: "66666666-6666-4666-8666-666666666603",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: mockStudios[0].id,
    member_id: mockMembers[1].id,
    package_id: mockPackages[1].id,
    date: "2026-06-02",
    customer_name: "陈先生",
    type: "private_package",
    amount: 5000,
    commissionable: true,
    note: "私教包",
    created_at: mockCreatedAt
  },
  {
    id: "66666666-6666-4666-8666-666666666604",
    user_id: mockUserId,
    teacher_id: mockTeachers[1].id,
    studio_id: mockStudios[0].id,
    member_id: null,
    package_id: null,
    date: "2026-06-10",
    customer_name: "散客",
    type: "product",
    amount: 299,
    commissionable: false,
    note: "不计入提成的瑜伽垫销售",
    created_at: mockCreatedAt
  }
];

export const mockSalaryRules: SalaryRule[] = [
  {
    id: "77777777-7777-4777-8777-777777777701",
    user_id: mockUserId,
    teacher_id: null,
    studio_id: null,
    name: "通用工资规则",
    raw_text: "团课 100 元/节；私教按课包单节成交价 40%；体验课不计；代课 80 元/节。业绩按阶梯提成。",
    structured_rule: {
      class_fee_rules: [
        {
          course_type: "group",
          fee_type: "fixed_per_class",
          amount: 100
        },
        {
          course_type: "private",
          fee_type: "percentage_of_unit_price",
          rate: 0.4
        },
        {
          course_type: "trial",
          fee_type: "none",
          amount: 0
        },
        {
          course_type: "substitute",
          fee_type: "fixed_per_class",
          amount: 80
        }
      ],
      commission_rules: [
        {
          min_amount: 0,
          max_amount: 10000,
          rate: 0.03
        },
        {
          min_amount: 10000,
          max_amount: 30000,
          rate: 0.05
        },
        {
          min_amount: 30000,
          max_amount: null,
          rate: 0.08
        }
      ],
      commission_mode: "tiered",
      bonus_rules: [],
      deduction_rules: [],
      uncertain_items: []
    },
    source_type: "manual",
    active: true,
    created_at: mockCreatedAt
  }
];

export const mockSalaryCalculations: SalaryCalculation[] = [
  {
    id: "88888888-8888-4888-8888-888888888801",
    user_id: mockUserId,
    teacher_id: mockTeachers[0].id,
    studio_id: null,
    month: "2026-06",
    class_fee_total: 420,
    performance_total: 8899,
    commission_total: 266.97,
    bonus_total: 0,
    deduction_total: 0,
    salary_total: 686.97,
    breakdown: {
      classFees: [],
      commissions: [],
      warnings: []
    },
    status: "unsettled",
    actual_paid_amount: null,
    settled_at: null,
    note: null,
    created_at: mockCreatedAt,
    updated_at: mockCreatedAt
  }
];

export const activeMockSalaryRule = mockSalaryRules.find((rule) => rule.active);
