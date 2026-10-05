-- Applied to the existing "raconte moi" project after checking its exposed schemas.
-- Preserve public and graphql_public. Never expose matache_private.
-- On another shared project, first discover and retain every already exposed schema.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, matache';
notify pgrst, 'reload config';
