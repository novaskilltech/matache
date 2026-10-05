alter table matache.analyses add column processing_at timestamptz,add column source_result jsonb;
create function matache_private.keep_analysis_source() returns trigger language plpgsql security invoker set search_path='' as $$begin if new.status='VALIDATED' and old.status<>'VALIDATED' then new.source_result:=old.result; end if;return new;end$$;
create trigger keep_analysis_source before update on matache.analyses for each row execute function matache_private.keep_analysis_source();
