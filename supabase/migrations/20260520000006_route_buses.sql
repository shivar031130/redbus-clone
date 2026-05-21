alter table public.routes
add column assigned_buses uuid[] not null default '{}'::uuid[];
