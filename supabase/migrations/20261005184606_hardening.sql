create table matache_private.request_budgets(workspace_id uuid not null references matache.workspaces(id),kind text not null,period timestamptz not null,count integer not null,primary key(workspace_id,kind,period));
alter table matache_private.request_budgets enable row level security;
revoke all on matache_private.request_budgets from public,anon,authenticated;
create function matache_private.consume_budget(w uuid,k text) returns boolean language plpgsql security definer set search_path='' as $$declare used integer;limit_count integer;begin
if auth.uid() is null or not matache_private.is_member(w) then raise exception 'Unauthorized';end if;
if k='upload' then limit_count:=120;elsif k='ai' then limit_count:=60;else raise exception 'Invalid budget';end if;
insert into matache_private.request_budgets(workspace_id,kind,period,count) values(w,k,date_trunc('hour',now()),1) on conflict(workspace_id,kind,period) do update set count=request_budgets.count+1 returning count into used;
return used<=limit_count;
end$$;
revoke all on function matache_private.consume_budget(uuid,text) from public;grant execute on function matache_private.consume_budget(uuid,text) to authenticated;
create function matache.consume_budget(p_workspace uuid,p_kind text) returns boolean language sql security invoker set search_path='' as $$select matache_private.consume_budget(p_workspace,p_kind)$$;
revoke all on function matache.consume_budget(uuid,text) from public;grant execute on function matache.consume_budget(uuid,text) to authenticated;
-- Workspace changes cannot move an existing row into another workspace, even for a member of both.
create function matache_private.immutable_workspace() returns trigger language plpgsql security invoker set search_path='' as $$begin if new.workspace_id<>old.workspace_id then raise exception 'Workspace is immutable';end if;return new;end$$;
do $$declare t text;begin foreach t in array array['clients','analyses','attachments','actions','reminders','extracted_fields','action_events','push_subscriptions'] loop execute format('create trigger immutable_workspace before update on matache.%I for each row execute function matache_private.immutable_workspace()',t);end loop;end$$;
