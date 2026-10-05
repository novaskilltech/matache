alter table public.analyses add column processing_at timestamptz,add column source_result jsonb;
create function private.keep_analysis_source() returns trigger language plpgsql security invoker set search_path='' as $$begin if new.status='VALIDATED' and old.status<>'VALIDATED' then new.source_result:=old.result; end if;return new;end$$;
create trigger keep_analysis_source before update on public.analyses for each row execute function private.keep_analysis_source();
