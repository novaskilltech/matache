create function public.validate_dossier(p_workspace uuid,p_analysis uuid,p_result jsonb,p_client uuid default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.analyses; c uuid; task uuid; group_name text; f record; source_id uuid; value_json jsonb; group_data jsonb; normalized text:=nullif(p_result#>>'{client,phone_normalized}','');
begin
select * into a from public.analyses where workspace_id=p_workspace and id=p_analysis for update;
if a.id is null then raise exception 'Analysis inaccessible';end if;
if a.status='VALIDATED' then select id into task from public.actions where workspace_id=p_workspace and analysis_id=p_analysis;return task;end if;
if a.status not in ('READY','FAILED','UPLOADED') then raise exception 'Analysis not ready';end if;
if p_client is not null then
 select id into c from public.clients where id=p_client and workspace_id=p_workspace;
 if c is null then raise exception 'Client inaccessible';end if;
 if normalized is not null and exists(select 1 from public.clients where workspace_id=p_workspace and phone_normalized=normalized and id<>c) then raise exception 'Phone belongs to another client';end if;
 update public.clients set name=coalesce(nullif(p_result#>>'{client,name}',''),name),phone=coalesce(nullif(p_result#>>'{client,phone}',''),phone),phone_normalized=coalesce(normalized,phone_normalized) where id=c;
else
 insert into public.clients(workspace_id,name,phone,phone_normalized) values(p_workspace,nullif(p_result#>>'{client,name}',''),nullif(p_result#>>'{client,phone}',''),normalized)
 on conflict(workspace_id,phone_normalized) where phone_normalized is not null do update set name=coalesce(excluded.name,clients.name),phone=coalesce(excluded.phone,clients.phone)
 returning id into c;
end if;
-- Preserve history in extracted_fields; only confirmed non-null values change the current dossier.
foreach group_name in array array['travel','documents','financial'] loop
 group_data:='{}'::jsonb;
 for f in select * from jsonb_each(p_result->group_name) loop
  if f.value<>'null'::jsonb and f.value<>'[]'::jsonb then group_data:=group_data||jsonb_build_object(f.key,f.value);end if;
 end loop;
 if group_name='travel' then update public.clients set travel=travel||group_data where id=c;
 elsif group_name='documents' then update public.clients set documents=documents||group_data where id=c;
 else update public.clients set financial=financial||group_data where id=c;end if;
end loop;
insert into public.actions(workspace_id,client_id,analysis_id,title,description,category,status,priority,action_owner,due_at,context)
values(p_workspace,c,p_analysis,p_result#>>'{action,title}',coalesce(p_result#>>'{action,description}',''),p_result#>>'{action,category}',p_result#>>'{action,status}',p_result#>>'{action,priority}',p_result#>>'{request,action_owner}',nullif(p_result#>>'{action,due_at}','')::timestamptz,jsonb_build_object('summary',p_result#>>'{request,summary}','warnings',p_result->'warnings','chronology',p_result->'chronology')) returning id into task;
update public.analyses set status='VALIDATED',client_id=c,result=p_result where id=p_analysis;
update public.attachments set client_id=c where workspace_id=p_workspace and analysis_id=p_analysis;
foreach group_name in array array['client','request','travel','documents','financial','action'] loop
 for f in select * from jsonb_each(p_result->group_name) loop
 if f.value='null'::jsonb or f.value='[]'::jsonb or f.value='""'::jsonb then continue;end if;
 select (e->'attachment_ids'->>0)::uuid into source_id from jsonb_array_elements(coalesce(p_result->'evidence','[]'::jsonb)) e where e->>'field_path'=group_name||'.'||f.key limit 1;
 if source_id is not null and not exists(select 1 from public.attachments where id=source_id and workspace_id=p_workspace and analysis_id=p_analysis) then raise exception 'Invalid evidence attachment';end if;
 insert into public.extracted_fields(workspace_id,client_id,analysis_id,attachment_id,field_path,value,confidence) values(p_workspace,c,p_analysis,source_id,group_name||'.'||f.key,f.value,coalesce((p_result->'confidence'->>group_name)::numeric,0));
 end loop;
end loop;
insert into public.action_events(workspace_id,action_id,client_id,event_type,payload) values(p_workspace,task,c,'CREATED',jsonb_build_object('analysis_id',p_analysis));
if nullif(p_result#>>'{action,due_at}','') is not null and p_result#>>'{action,status}'<>'DONE' then insert into public.reminders(workspace_id,action_id,due_at) values(p_workspace,task,(p_result#>>'{action,due_at}')::timestamptz);end if;
return task;
end$$;
revoke all on function public.validate_dossier(uuid,uuid,jsonb,uuid) from public;
grant execute on function public.validate_dossier(uuid,uuid,jsonb,uuid) to authenticated;
