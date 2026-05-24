create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label_es text not null,
  label_en text not null,
  target decimal(12,2) not null,
  current_amount decimal(12,2) default 0,
  deadline date,
  color text default '#7ab87a',
  icon text default '◉',
  created_at timestamptz default now()
);

create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'card')),
  balance decimal(12,2) default 0,
  color text default '#7ab87a',
  account_limit decimal(12,2),
  created_at timestamptz default now()
);

create table if not exists investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label_es text not null,
  label_en text not null,
  value decimal(12,2) not null,
  return_rate decimal(6,2) default 0,
  type text,
  created_at timestamptz default now()
);

create table if not exists debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label_es text not null,
  label_en text not null,
  balance decimal(12,2) not null,
  rate decimal(6,2) default 0,
  monthly decimal(10,2) default 0,
  remaining int default 0,
  original_months int default 0,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  price decimal(10,2) not null,
  cycle text default 'monthly',
  category text,
  created_at timestamptz default now()
);

alter table goals enable row level security;
alter table accounts enable row level security;
alter table investments enable row level security;
alter table debts enable row level security;
alter table subscriptions enable row level security;

create policy "own goals" on goals for all using (auth.uid() = user_id);
create policy "own accounts" on accounts for all using (auth.uid() = user_id);
create policy "own investments" on investments for all using (auth.uid() = user_id);
create policy "own debts" on debts for all using (auth.uid() = user_id);
create policy "own subscriptions" on subscriptions for all using (auth.uid() = user_id);
