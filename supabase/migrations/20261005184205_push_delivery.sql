create function matache.claim_reminders(p_limit integer default 100) returns setof matache.reminders language sql security invoker set search_path='' as $$
update matache.reminders r set claimed_at=now(),attempts=r.attempts+1 where r.id in (
select pending.id from matache.reminders pending join matache.actions a on a.id=pending.action_id and a.workspace_id=pending.workspace_id
where pending.sent_at is null and pending.due_at<=now() and a.status<>'DONE' and pending.attempts<5
and (pending.claimed_at is null or pending.claimed_at<now()-interval '10 minutes')
and exists(select 1 from matache.push_subscriptions s where s.workspace_id=pending.workspace_id)
order by pending.due_at limit least(greatest(p_limit,1),100) for update of pending skip locked
) returning r.*$$;
revoke all on function matache.claim_reminders(integer) from public,anon,authenticated;
grant execute on function matache.claim_reminders(integer) to service_role;
grant select,update on matache.reminders to service_role;
grant select on matache.actions to service_role;
grant select,delete on matache.push_subscriptions to service_role;
