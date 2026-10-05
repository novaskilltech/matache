create schema matache;
revoke all on schema matache from public;
grant usage on schema matache to authenticated,service_role;
create schema if not exists matache_private;
revoke all on schema matache_private from public;
grant usage on schema matache_private to authenticated;
create table matache.workspaces(id uuid primary key default gen_random_uuid(), name text not null default 'Mon espace', created_at timestamptz not null default now());
create table matache.workspace_members(workspace_id uuid not null references matache.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null default 'owner' check(role in ('owner','member')),primary key(workspace_id,user_id));
create index workspace_members_user on matache.workspace_members(user_id);
create table matache.profiles(id uuid primary key references auth.users(id) on delete cascade,workspace_id uuid not null references matache.workspaces(id),display_name text,timezone text not null default 'Europe/Paris',phone_country text not null default 'FR');
create function matache_private.is_member(w uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from matache.workspace_members where workspace_id=w and user_id=auth.uid())$$;
revoke all on function matache_private.is_member(uuid) from public;
grant execute on function matache_private.is_member(uuid) to authenticated;
create function matache_private.bootstrap() returns uuid language plpgsql security definer set search_path='' as $$declare w uuid; u uuid:=auth.uid(); begin
if u is null then raise exception 'Authentication required'; end if;
perform pg_advisory_xact_lock(hashtext(u::text));
select workspace_id into w from matache.workspace_members where user_id=u order by workspace_id limit 1;
if w is null then insert into matache.workspaces default values returning id into w; insert into matache.workspace_members(workspace_id,user_id) values(w,u); insert into matache.profiles(id,workspace_id) values(u,w); end if;
return w; end$$;
revoke all on function matache_private.bootstrap() from public;
grant execute on function matache_private.bootstrap() to authenticated;
create function matache.bootstrap_workspace() returns uuid language sql security invoker set search_path='' as $$select matache_private.bootstrap()$$;
revoke all on function matache.bootstrap_workspace() from public;
grant execute on function matache.bootstrap_workspace() to authenticated;

create table matache.clients(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),name text,phone text,phone_normalized text check(phone_normalized is null or phone_normalized ~ '^\+[1-9][0-9]{6,14}$'),travel jsonb not null default '{}',documents jsonb not null default '{}',financial jsonb not null default '{}',created_at timestamptz not null default now(),unique(workspace_id,id));
create unique index clients_phone_unique on matache.clients(workspace_id,phone_normalized) where phone_normalized is not null;
create table matache.analyses(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),client_id uuid,status text not null default 'UPLOADED' check(status in ('UPLOADED','PROCESSING','READY','FAILED','VALIDATED','IGNORED')),result jsonb,error_code text,created_at timestamptz not null default now(),unique(workspace_id,id),foreign key(workspace_id,client_id) references matache.clients(workspace_id,id));
create table matache.attachments(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),client_id uuid,analysis_id uuid not null,storage_path text not null,mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),size_bytes integer not null check(size_bytes>0 and size_bytes<=10485760),created_at timestamptz not null default now(),unique(workspace_id,id),check(split_part(storage_path,'/',1)=workspace_id::text),foreign key(workspace_id,client_id) references matache.clients(workspace_id,id),foreign key(workspace_id,analysis_id) references matache.analyses(workspace_id,id) on delete cascade);
create table matache.actions(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),client_id uuid not null,analysis_id uuid,title text not null check(length(title) between 1 and 240),description text not null default '',category text not null check(category in ('INVOICE','CALLBACK','OMRA_INFO','TRIP_SUMMARY','WAITING_CLIENT','OTHER')),status text not null default 'TODO' check(status in ('TODO','WAITING','DONE')),priority text not null default 'NORMAL' check(priority in ('NORMAL','TODAY','URGENT')),action_owner text not null default 'ACTION_USER' check(action_owner in ('ACTION_USER','ACTION_CLIENT','ACTION_THIRD_PARTY')),due_at timestamptz,context jsonb not null default '{}',created_at timestamptz not null default now(),unique(workspace_id,id),unique(workspace_id,analysis_id),foreign key(workspace_id,client_id) references matache.clients(workspace_id,id),foreign key(workspace_id,analysis_id) references matache.analyses(workspace_id,id));
create index actions_queue on matache.actions(workspace_id,status,due_at);
create table matache.reminders(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),action_id uuid not null,due_at timestamptz not null,sent_at timestamptz,claimed_at timestamptz,attempts integer not null default 0,foreign key(workspace_id,action_id) references matache.actions(workspace_id,id) on delete cascade);
create unique index reminders_one_pending on matache.reminders(workspace_id,action_id) where sent_at is null;
create index reminders_due on matache.reminders(due_at) where sent_at is null;
create table matache.extracted_fields(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),client_id uuid not null,analysis_id uuid not null,attachment_id uuid,field_path text not null,value jsonb,confidence numeric not null check(confidence between 0 and 1),created_at timestamptz not null default now(),foreign key(workspace_id,client_id) references matache.clients(workspace_id,id),foreign key(workspace_id,analysis_id) references matache.analyses(workspace_id,id),foreign key(workspace_id,attachment_id) references matache.attachments(workspace_id,id));
create table matache.action_events(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),action_id uuid not null,client_id uuid not null,event_type text not null,payload jsonb not null default '{}',created_at timestamptz not null default now(),foreign key(workspace_id,action_id) references matache.actions(workspace_id,id) on delete cascade,foreign key(workspace_id,client_id) references matache.clients(workspace_id,id));
create table matache.push_subscriptions(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references matache.workspaces(id),user_id uuid not null references auth.users(id) on delete cascade,endpoint text not null unique,keys jsonb not null,created_at timestamptz not null default now());

alter table matache.workspaces enable row level security;
alter table matache.workspace_members enable row level security;
alter table matache.profiles enable row level security;
create policy workspace_read on matache.workspaces for select to authenticated using(matache_private.is_member(id));
create policy members_read on matache.workspace_members for select to authenticated using(matache_private.is_member(workspace_id));
create policy profile_read on matache.profiles for select to authenticated using(id=auth.uid() and matache_private.is_member(workspace_id));
create policy profile_update on matache.profiles for update to authenticated using(id=auth.uid() and matache_private.is_member(workspace_id)) with check(id=auth.uid() and matache_private.is_member(workspace_id));
grant select on matache.workspaces,matache.workspace_members to authenticated;
grant select,update on matache.profiles to authenticated;
do $$declare t text;begin foreach t in array array['clients','analyses','attachments','actions','reminders','extracted_fields','action_events'] loop
execute format('alter table matache.%I enable row level security',t);
execute format('create policy workspace_access on matache.%I for all to authenticated using(matache_private.is_member(workspace_id)) with check(matache_private.is_member(workspace_id))',t);
execute format('grant select,insert,update,delete on matache.%I to authenticated',t);
execute format('create index %I on matache.%I(workspace_id)',t||'_workspace_idx',t);
end loop;end$$;
alter table matache.push_subscriptions enable row level security;
create policy subscription_access on matache.push_subscriptions for all to authenticated using(user_id=auth.uid() and matache_private.is_member(workspace_id)) with check(user_id=auth.uid() and matache_private.is_member(workspace_id));
grant select,insert,update,delete on matache.push_subscriptions to authenticated;
create index subscriptions_workspace on matache.push_subscriptions(workspace_id);

create function matache.transition_action(p_workspace uuid,p_action uuid,p_status text,p_due timestamptz default null,p_event text default 'STATUS_CHANGED') returns uuid language plpgsql security invoker set search_path='' as $$declare a matache.actions; begin
select * into a from matache.actions where id=p_action and workspace_id=p_workspace for update;
if a.id is null then raise exception 'Action inaccessible'; end if;
update matache.actions set status=p_status,due_at=coalesce(p_due,due_at) where id=a.id;
insert into matache.action_events(workspace_id,action_id,client_id,event_type,payload) values(p_workspace,a.id,a.client_id,p_event,jsonb_build_object('from',a.status,'to',p_status,'due_at',p_due));
delete from matache.reminders where workspace_id=p_workspace and action_id=a.id and sent_at is null;
if p_status<>'DONE' and coalesce(p_due,a.due_at) is not null then insert into matache.reminders(workspace_id,action_id,due_at) values(p_workspace,a.id,coalesce(p_due,a.due_at)); end if;
return a.id; end$$;
revoke all on function matache.transition_action(uuid,uuid,text,timestamptz,text) from public;
grant execute on function matache.transition_action(uuid,uuid,text,timestamptz,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('matache-private','matache-private',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy matache_objects on storage.objects for all to authenticated using(bucket_id='matache-private' and exists(select 1 from matache.workspace_members where user_id=auth.uid() and workspace_id::text=split_part(name,'/',1))) with check(bucket_id='matache-private' and exists(select 1 from matache.workspace_members where user_id=auth.uid() and workspace_id::text=split_part(name,'/',1)));

-- A restrictive guard keeps this bucket isolated even if another app adds broad policies.
create policy matache_bucket_guard on storage.objects as restrictive for all to authenticated using(case when bucket_id='matache-private' then exists(select 1 from matache.workspace_members where user_id=auth.uid() and workspace_id::text=split_part(name,'/',1)) else true end) with check(case when bucket_id='matache-private' then exists(select 1 from matache.workspace_members where user_id=auth.uid() and workspace_id::text=split_part(name,'/',1)) else true end);
