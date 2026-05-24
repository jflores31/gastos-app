create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tipo text not null,
  categoria text not null,
  concepto text not null,
  valor decimal(10,2) not null,
  fecha timestamptz not null,
  anomaly boolean default false,
  created_at timestamptz default now()
);

create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria text not null,
  monto decimal(10,2) not null,
  unique(user_id, categoria)
);

alter table transactions enable row level security;
alter table budgets enable row level security;

create policy "own transactions" on transactions for all using (auth.uid() = user_id);
create policy "own budgets" on budgets for all using (auth.uid() = user_id);
