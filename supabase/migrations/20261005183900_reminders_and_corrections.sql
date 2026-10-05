create function public.edit_action(p_workspace uuid,p_action uuid,p_patch jsonb) returns void language plpgsql security invoker set search_path='' as $$declare a public.actions;begin
select * into a from public.actions where workspace_id=p_workspace and id=p_action for update;if a.id is null then raise exception 'Action inaccessible';end if;
update public.actions set title=p_patch->>'title',description=p_patch->>'description',category=p_patch->>'category',priority=p_patch->>'priority' where id=a.id;
insert into public.action_events(workspace_id,action_id,client_id,event_type,payload) values(p_workspace,a.id,a.client_id,'EDITED','{}');end$$;
revoke all on function public.edit_action(uuid,uuid,jsonb) from public;grant execute on function public.edit_action(uuid,uuid,jsonb) to authenticated;
create function public.correct_client(p_workspace uuid,p_client uuid,p_patch jsonb) returns void language plpgsql security invoker set search_path='' as $$declare c public.clients;begin
select * into c from public.clients where workspace_id=p_workspace and id=p_client for update;if c.id is null then raise exception 'Client inaccessible';end if;
update public.clients set name=nullif(p_patch->>'name',''),phone=nullif(p_patch->>'phone',''),phone_normalized=nullif(p_patch->>'phone_normalized',''),travel=p_patch->'travel',documents=p_patch->'documents',financial=p_patch->'financial' where id=c.id;
insert into public.action_events(workspace_id,action_id,client_id,event_type,payload) select p_workspace,id,c.id,'CLIENT_CORRECTED',jsonb_build_object('previous',jsonb_build_object('name',c.name,'phone',c.phone,'travel',c.travel,'documents',c.documents,'financial',c.financial)) from public.actions where workspace_id=p_workspace and client_id=c.id order by created_at desc limit 1;
end$$;
revoke all on function public.correct_client(uuid,uuid,jsonb) from public;grant execute on function public.correct_client(uuid,uuid,jsonb) to authenticated;
create function public.follow_up(p_workspace uuid,p_action uuid,p_kind text) returns void language plpgsql security invoker set search_path='' as $$declare a public.actions;begin
select * into a from public.actions where workspace_id=p_workspace and id=p_action for update;if a.id is null then raise exception 'Action inaccessible';end if;
if p_kind not in ('FOLLOW_UP','DOCUMENTS_RECEIVED') then raise exception 'Invalid operation';end if;
if p_kind='DOCUMENTS_RECEIVED' then
update public.clients set documents=jsonb_set(documents,'{missing_documents}','[]'::jsonb) where id=a.client_id;
update public.actions set title='Vérifier les documents reçus',category='OTHER',action_owner='ACTION_USER' where id=a.id;
else update public.actions set action_owner='ACTION_USER' where id=a.id;end if;
perform public.transition_action(p_workspace,p_action,'TODO',now(),p_kind);
end$$;
revoke all on function public.follow_up(uuid,uuid,text) from public;grant execute on function public.follow_up(uuid,uuid,text) to authenticated;
