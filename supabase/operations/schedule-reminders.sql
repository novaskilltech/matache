-- Run after deployment. Store matache_app_url and matache_cron_secret in Vault first.
-- The latter must match Vercel CRON_SECRET. Never commit secrets to Git.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$declare app_url text;token text;begin
select decrypted_secret into app_url from vault.decrypted_secrets where name='matache_app_url';
select decrypted_secret into token from vault.decrypted_secrets where name='matache_cron_secret';
if app_url is null or app_url !~ '^https://[^/]+$' then raise exception 'Configure the HTTPS production origin in Vault';end if;
if token is null or length(token)<32 then raise exception 'Configure the MaTache cron secret in Vault';end if;
end$$;
select cron.schedule('matache-reminders','*/5 * * * *',$job$
select net.http_get(
  url:=(select decrypted_secret from vault.decrypted_secrets where name='matache_app_url')||'/api/cron/reminders',
  headers:=jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='matache_cron_secret')),
  timeout_milliseconds:=120000
);
$job$);
commit;
