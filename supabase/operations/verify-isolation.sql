begin;
do $test$
declare ua uuid:=gen_random_uuid();ub uuid:=gen_random_uuid();wa uuid;wb uuid;aid uuid;task uuid;again uuid;cid uuid;result jsonb:='{"client":{"name":"Mme Benali","phone":null,"phone_normalized":null},"request":{"category":"INVOICE","summary":"Dossier fictif de vérification","action_owner":"ACTION_USER"},"travel":{},"documents":{},"financial":{},"action":{"title":"Préparer la facture","description":"","category":"INVOICE","status":"TODO","priority":"NORMAL","due_at":null},"confidence":{},"evidence":[]}'::jsonb;
begin
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values(ua,'matache-qa-'||ua::text||'@example.invalid','authenticated','authenticated',now(),'{}','{}'),(ub,'matache-qa-'||ub::text||'@example.invalid','authenticated','authenticated',now(),'{}','{}');
perform set_config('request.jwt.claim.sub',ua::text,true);
perform set_config('request.jwt.claims',jsonb_build_object('sub',ua,'role','authenticated')::text,true);
execute 'set local role authenticated';
wa:=matache.bootstrap_workspace();
if matache.bootstrap_workspace()<>wa then raise exception 'BOOTSTRAP_NOT_IDEMPOTENT';end if;
insert into matache.analyses(workspace_id) values(wa) returning id into aid;
task:=matache.validate_dossier(wa,aid,result,null);
again:=matache.validate_dossier(wa,aid,result,null);
if task<>again then raise exception 'VALIDATION_NOT_IDEMPOTENT';end if;
select client_id into cid from matache.actions where id=task;
insert into storage.objects(bucket_id,name) values('matache-private',wa::text||'/clients/'||aid::text||'/attachments/'||gen_random_uuid()::text||'.png');
perform matache.transition_action(wa,task,'WAITING',now()+interval '1 day');
if (select count(*) from matache.reminders where action_id=task and sent_at is null)<>1 then raise exception 'REMINDER_NOT_CREATED';end if;
perform matache.transition_action(wa,task,'DONE');
if exists(select 1 from matache.reminders where action_id=task and sent_at is null) then raise exception 'DONE_REMINDER_REMAINS';end if;
perform set_config('request.jwt.claim.sub',ub::text,true);
perform set_config('request.jwt.claims',jsonb_build_object('sub',ub,'role','authenticated')::text,true);
wb:=matache.bootstrap_workspace();
if wa=wb or exists(select 1 from matache.clients where id=cid) or exists(select 1 from matache.actions where id=task) then raise exception 'CROSS_WORKSPACE_READ';end if;
if exists(select 1 from storage.objects where bucket_id='matache-private' and split_part(name,'/',1)=wa::text) then raise exception 'CROSS_WORKSPACE_STORAGE_READ';end if;
begin
insert into matache.clients(workspace_id,name) values(wa,'Forbidden');
raise exception 'CROSS_WORKSPACE_WRITE_ALLOWED';
exception when insufficient_privilege then null;end;
execute 'set local role anon';
begin
perform matache.bootstrap_workspace();
raise exception 'ANONYMOUS_BOOTSTRAP_ALLOWED';
exception when insufficient_privilege then null;end;
execute 'reset role';
end $test$;
rollback;
select 'PASS: two users, RLS, Storage, validation, reminders, rollback' as checks;
