create extension if not exists "pgcrypto";

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  phone text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  phone text,
  address text,
  contact_name text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  studio_id uuid references public.studios(id),
  name text not null,
  phone text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  member_id uuid not null references public.members(id),
  teacher_id uuid references public.teachers(id),
  studio_id uuid references public.studios(id),
  package_name text not null,
  course_type text not null,
  total_amount numeric not null,
  total_sessions numeric not null,
  unit_price numeric not null,
  purchase_date date not null,
  note text,
  created_at timestamptz default now(),
  constraint packages_total_amount_nonnegative check (total_amount >= 0),
  constraint packages_total_sessions_positive check (total_sessions > 0),
  constraint packages_unit_price_nonnegative check (unit_price >= 0),
  constraint packages_course_type_valid check (course_type in ('group', 'private', 'trial', 'substitute', 'other'))
);

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  package_id uuid not null references public.packages(id) on delete cascade,
  studio_id uuid references public.studios(id),
  member_id uuid references public.members(id),
  item_name text not null,
  course_type text not null,
  sessions numeric not null,
  unit_price numeric not null,
  total_amount numeric not null,
  note text,
  created_at timestamptz default now(),
  constraint package_items_sessions_positive check (sessions > 0),
  constraint package_items_unit_price_nonnegative check (unit_price >= 0),
  constraint package_items_total_amount_nonnegative check (total_amount >= 0),
  constraint package_items_course_type_valid check (course_type in ('group', 'private', 'trial', 'substitute', 'other'))
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  teacher_id uuid not null references public.teachers(id),
  studio_id uuid references public.studios(id),
  member_id uuid references public.members(id),
  package_id uuid references public.packages(id),
  package_item_id uuid references public.package_items(id),
  date date not null,
  course_name text not null,
  course_type text not null,
  student_count integer not null default 1,
  hours numeric not null default 1,
  manual_fee numeric,
  note text,
  created_at timestamptz default now(),
  constraint classes_student_count_nonnegative check (student_count >= 0),
  constraint classes_hours_positive check (hours > 0),
  constraint classes_manual_fee_nonnegative check (manual_fee is null or manual_fee >= 0),
  constraint classes_course_type_valid check (course_type in ('group', 'private', 'trial', 'substitute', 'other'))
);

create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  teacher_id uuid not null references public.teachers(id),
  studio_id uuid references public.studios(id),
  member_id uuid references public.members(id),
  package_id uuid references public.packages(id),
  date date not null,
  customer_name text,
  type text not null,
  amount numeric not null,
  commissionable boolean not null default true,
  note text,
  created_at timestamptz default now(),
  constraint performances_amount_nonnegative check (amount >= 0),
  constraint performances_type_valid check (type in ('new_card', 'renewal', 'private_package', 'product', 'other'))
);

create table if not exists public.salary_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  teacher_id uuid references public.teachers(id),
  studio_id uuid references public.studios(id),
  name text not null,
  raw_text text not null,
  structured_rule jsonb not null,
  source_type text not null,
  active boolean not null default false,
  created_at timestamptz default now(),
  constraint salary_rules_source_type_valid check (source_type in ('manual', 'image_ai'))
);

create table if not exists public.salary_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  teacher_id uuid not null references public.teachers(id),
  studio_id uuid references public.studios(id),
  month text not null,
  class_fee_total numeric not null default 0,
  performance_total numeric not null default 0,
  commission_total numeric not null default 0,
  bonus_total numeric not null default 0,
  deduction_total numeric not null default 0,
  salary_total numeric not null default 0,
  breakdown jsonb not null,
  status text not null default 'unsettled',
  actual_paid_amount numeric,
  settled_at date,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint salary_calculations_month_format check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint salary_calculations_class_fee_total_nonnegative check (class_fee_total >= 0),
  constraint salary_calculations_performance_total_nonnegative check (performance_total >= 0),
  constraint salary_calculations_commission_total_nonnegative check (commission_total >= 0),
  constraint salary_calculations_bonus_total_nonnegative check (bonus_total >= 0),
  constraint salary_calculations_deduction_total_nonnegative check (deduction_total >= 0),
  constraint salary_calculations_status_valid check (status in ('unsettled', 'settled')),
  constraint salary_calculations_actual_paid_amount_nonnegative check (actual_paid_amount is null or actual_paid_amount >= 0)
);

alter table public.teachers enable row level security;
alter table public.studios enable row level security;
alter table public.members enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.classes enable row level security;
alter table public.performances enable row level security;
alter table public.salary_rules enable row level security;
alter table public.salary_calculations enable row level security;

create policy "teachers_select_own" on public.teachers for select using (auth.uid() = user_id);
create policy "teachers_insert_own" on public.teachers for insert with check (auth.uid() = user_id);
create policy "teachers_update_own" on public.teachers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "teachers_delete_own" on public.teachers for delete using (auth.uid() = user_id);

create policy "studios_select_own" on public.studios for select using (auth.uid() = user_id);
create policy "studios_insert_own" on public.studios for insert with check (auth.uid() = user_id);
create policy "studios_update_own" on public.studios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "studios_delete_own" on public.studios for delete using (auth.uid() = user_id);

create policy "members_select_own" on public.members for select using (auth.uid() = user_id);
create policy "members_insert_own" on public.members for insert with check (auth.uid() = user_id);
create policy "members_update_own" on public.members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "members_delete_own" on public.members for delete using (auth.uid() = user_id);

create policy "packages_select_own" on public.packages for select using (auth.uid() = user_id);
create policy "packages_insert_own" on public.packages for insert with check (auth.uid() = user_id);
create policy "packages_update_own" on public.packages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "packages_delete_own" on public.packages for delete using (auth.uid() = user_id);

create policy "package_items_select_own" on public.package_items for select using (auth.uid() = user_id);
create policy "package_items_insert_own" on public.package_items for insert with check (auth.uid() = user_id);
create policy "package_items_update_own" on public.package_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "package_items_delete_own" on public.package_items for delete using (auth.uid() = user_id);

create policy "classes_select_own" on public.classes for select using (auth.uid() = user_id);
create policy "classes_insert_own" on public.classes for insert with check (auth.uid() = user_id);
create policy "classes_update_own" on public.classes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "classes_delete_own" on public.classes for delete using (auth.uid() = user_id);

create policy "performances_select_own" on public.performances for select using (auth.uid() = user_id);
create policy "performances_insert_own" on public.performances for insert with check (auth.uid() = user_id);
create policy "performances_update_own" on public.performances for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "performances_delete_own" on public.performances for delete using (auth.uid() = user_id);

create policy "salary_rules_select_own" on public.salary_rules for select using (auth.uid() = user_id);
create policy "salary_rules_insert_own" on public.salary_rules for insert with check (auth.uid() = user_id);
create policy "salary_rules_update_own" on public.salary_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "salary_rules_delete_own" on public.salary_rules for delete using (auth.uid() = user_id);

create policy "salary_calculations_select_own" on public.salary_calculations for select using (auth.uid() = user_id);
create policy "salary_calculations_insert_own" on public.salary_calculations for insert with check (auth.uid() = user_id);
create policy "salary_calculations_update_own" on public.salary_calculations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "salary_calculations_delete_own" on public.salary_calculations for delete using (auth.uid() = user_id);
