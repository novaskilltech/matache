-- Only MaTache objects are changed: do not alter policies of the hosting application.
-- Keep the chosen workspace stable even when a user later joins another workspace.
create or replace function matache_private.bootstrap() returns uuid language plpgsql security definer set search_path='' as $$
declare w uuid;u uuid:=auth.uid();begin
if u is null then raise exception 'Authentication required';end if;
perform pg_advisory_xact_lock(hashtext('matache:'||u::text));
select p.workspace_id into w from matache.profiles p where p.id=u and exists(select 1 from matache.workspace_members m where m.workspace_id=p.workspace_id and m.user_id=u);
if w is not null then return w;end if;
select workspace_id into w from matache.workspace_members where user_id=u order by workspace_id limit 1;
if w is null then insert into matache.workspaces default values returning id into w;insert into matache.workspace_members(workspace_id,user_id) values(w,u);end if;
insert into matache.profiles(id,workspace_id) values(u,w) on conflict(id) do update set workspace_id=excluded.workspace_id;
return w;end$$;

create index profiles_workspace_idx on matache.profiles(workspace_id);
create index actions_client_idx on matache.actions(workspace_id,client_id);
create index analyses_client_idx on matache.analyses(workspace_id,client_id);
create index attachments_analysis_idx on matache.attachments(workspace_id,analysis_id);
create index attachments_client_idx on matache.attachments(workspace_id,client_id);
create index extracted_fields_client_idx on matache.extracted_fields(workspace_id,client_id);
create index extracted_fields_analysis_idx on matache.extracted_fields(workspace_id,analysis_id);
create index extracted_fields_attachment_idx on matache.extracted_fields(workspace_id,attachment_id);
create index action_events_action_idx on matache.action_events(workspace_id,action_id);
create index action_events_client_idx on matache.action_events(workspace_id,client_id);
create index push_subscriptions_user_idx on matache.push_subscriptions(user_id);

alter policy profile_read on matache.profiles using(id=(select auth.uid()) and matache_private.is_member(workspace_id));
alter policy profile_update on matache.profiles using(id=(select auth.uid()) and matache_private.is_member(workspace_id)) with check(id=(select auth.uid()) and matache_private.is_member(workspace_id));
alter policy subscription_access on matache.push_subscriptions using(user_id=(select auth.uid()) and matache_private.is_member(workspace_id)) with check(user_id=(select auth.uid()) and matache_private.is_member(workspace_id));
