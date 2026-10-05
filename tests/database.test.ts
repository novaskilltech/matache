import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { manualResult } from "@/lib/ai/schema";
import { readFileSync, readdirSync } from "node:fs";
let db: PGlite;
const userA = "00000000-0000-4000-8000-000000000001",
  userB = "00000000-0000-4000-8000-000000000002";
let wa: string, wb: string, clientId: string, actionId: string;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role authenticated;create role service_role bypassrls; create role anon; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant all on storage.objects to authenticated;`,
  );
  await db.exec(
    `create table public.profiles(id uuid primary key,label text);insert into public.profiles values('${userA}','Existing app');create function public.bootstrap_workspace() returns text language sql as $$select 'existing-app'::text$$;create schema private;create table private.existing_data(id integer);`,
  );
  for (const f of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec("set search_path=matache,public");
  await db.query("insert into auth.users values ($1),($2)", [userA, userB]);
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${userA}'`);
  wa = (
    await db.query<{ id: string }>("select matache.bootstrap_workspace() as id")
  ).rows[0].id;
  await db.exec(`set request.jwt.claim.sub='${userB}'`);
  wb = (
    await db.query<{ id: string }>("select matache.bootstrap_workspace() as id")
  ).rows[0].id;
  await db.exec(`set request.jwt.claim.sub='${userA}'`);
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("real PostgreSQL integration and RLS", () => {
  it("coexists with existing public tables, RPCs and private schemas", async () => {
    await db.exec("reset role");
    try {
      expect(
        (await db.query<{ label: string }>("select label from public.profiles"))
          .rows,
      ).toEqual([{ label: "Existing app" }]);
      expect(
        (
          await db.query<{ value: string }>(
            "select public.bootstrap_workspace() as value",
          )
        ).rows[0].value,
      ).toBe("existing-app");
      expect(
        (await db.query("select * from private.existing_data")).rows,
      ).toHaveLength(0);
      expect(
        (await db.query("select * from matache.profiles")).rows,
      ).toHaveLength(2);
    } finally {
      await db.exec(
        `set role authenticated;set request.jwt.claim.sub='${userA}'`,
      );
    }
  });
  it("creates a client and normalized unique number", async () => {
    clientId = (
      await db.query<{ id: string }>(
        "insert into clients(workspace_id,name,phone_normalized) values($1,'Mme Benali','+33612345678') returning id",
        [wa],
      )
    ).rows[0].id;
    expect(clientId).toBeTruthy();
    await expect(
      db.query(
        "insert into clients(workspace_id,name,phone_normalized) values($1,'Benali','+33612345678')",
        [wa],
      ),
    ).rejects.toThrow();
  });
  it("same name alone never blocks a new client", async () => {
    await expect(
      db.query(
        "insert into clients(workspace_id,name) values($1,'Mme Benali')",
        [wa],
      ),
    ).resolves.toBeDefined();
  });
  it("creates action and transitions TODO → WAITING → DONE with timeline", async () => {
    actionId = (
      await db.query<{ id: string }>(
        "insert into actions(workspace_id,client_id,title,category) values($1,$2,'Envoyer facture','INVOICE') returning id",
        [wa, clientId],
      )
    ).rows[0].id;
    await db.query(
      "select transition_action($1,$2,'WAITING',now()+interval '1 day')",
      [wa, actionId],
    );
    expect(
      (
        await db.query<{ status: string }>(
          "select status from actions where id=$1",
          [actionId],
        )
      ).rows[0].status,
    ).toBe("WAITING");
    await db.query("select transition_action($1,$2,'DONE')", [wa, actionId]);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from reminders where action_id=$1 and sent_at is null",
          [actionId],
        )
      ).rows[0].count,
    ).toBe(0);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from action_events where action_id=$1",
          [actionId],
        )
      ).rows[0].count,
    ).toBe(2);
  });
  it("denies cross-workspace reads, writes and links", async () => {
    expect(
      (await db.query("select * from clients where workspace_id=$1", [wb]))
        .rows,
    ).toHaveLength(0);
    await expect(
      db.query(
        "insert into clients(workspace_id,name) values($1,'forbidden')",
        [wb],
      ),
    ).rejects.toThrow();
    await db.exec(`set request.jwt.claim.sub='${userB}'`);
    expect(
      (await db.query("select * from actions where id=$1", [actionId])).rows,
    ).toHaveLength(0);
    await expect(
      db.query(
        "insert into actions(workspace_id,client_id,title,category) values($1,$2,'forbidden','OTHER')",
        [wb, clientId],
      ),
    ).rejects.toThrow();
    await expect(
      db.query("select transition_action($1,$2,'DONE')", [wa, actionId]),
    ).rejects.toThrow();
    await db.exec(`set request.jwt.claim.sub='${userA}'`);
  });
  it("enforces private storage membership and denies anonymous bootstrap", async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name) values('matache-private',$1)",
      [wa + "/clients/pending/attachments/example.png"],
    );
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values('matache-private',$1)",
        [wb + "/secret.png"],
      ),
    ).rejects.toThrow();
    await db.exec("set role anon");
    await expect(
      db.query("select matache.bootstrap_workspace()"),
    ).rejects.toThrow();
    await db.exec(
      `set role authenticated;set request.jwt.claim.sub='${userA}'`,
    );
  });
  it("guards MaTache storage against broad policies from another app", async () => {
    await db.exec(
      "reset role;create policy existing_app_storage on storage.objects for all to authenticated using(true) with check(true);set role authenticated",
    );
    try {
      await expect(
        db.query(
          "insert into storage.objects(bucket_id,name) values('other-app','non-uuid/file.png')",
        ),
      ).resolves.toBeDefined();
      await expect(
        db.query(
          "insert into storage.objects(bucket_id,name) values('matache-private',$1)",
          [wb + "/secret.png"],
        ),
      ).rejects.toThrow();
      expect(
        (
          await db.query(
            "select * from storage.objects where bucket_id='matache-private' and name like $1",
            [wb + "/%"],
          )
        ).rows,
      ).toHaveLength(0);
    } finally {
      await db.exec(
        "reset role;drop policy existing_app_storage on storage.objects;set role authenticated",
      );
    }
  });
  it("validates a dossier atomically, matches existing phone, keeps source facts and is idempotent", async () => {
    const aid = (
      await db.query<{ id: string }>(
        "insert into analyses(workspace_id) values($1) returning id",
        [wa],
      )
    ).rows[0].id;
    const attachment = (
      await db.query<{ id: string }>(
        "insert into attachments(workspace_id,analysis_id,storage_path,mime_type,size_bytes) values($1,$2,$3,'image/png',8) returning id",
        [wa, aid, wa + "/clients/pending/attachments/test.png"],
      )
    ).rows[0].id;
    const r = manualResult("INVOICE");
    r.client = {
      name: "Mme Benali",
      phone: "0612345678",
      phone_normalized: "+33612345678",
    };
    r.evidence = [{ field_path: "client.name", attachment_ids: [attachment] }];
    const args = [wa, aid, JSON.stringify(r)];
    const first = (
      await db.query<{ id: string }>(
        "select validate_dossier($1,$2,$3::jsonb) as id",
        args,
      )
    ).rows[0].id;
    const second = (
      await db.query<{ id: string }>(
        "select validate_dossier($1,$2,$3::jsonb) as id",
        args,
      )
    ).rows[0].id;
    expect(first).toBe(second);
    expect(
      (
        await db.query<{ client_id: string }>(
          "select client_id from actions where id=$1",
          [first],
        )
      ).rows[0].client_id,
    ).toBe(clientId);
    expect(
      (
        await db.query<{ attachment_id: string }>(
          "select attachment_id from extracted_fields where analysis_id=$1 and field_path='client.name'",
          [aid],
        )
      ).rows[0].attachment_id,
    ).toBe(attachment);
  });
  it("invalid evidence rolls back client and action creation", async () => {
    const aid = (
      await db.query<{ id: string }>(
        "insert into analyses(workspace_id) values($1) returning id",
        [wa],
      )
    ).rows[0].id;
    const r = manualResult();
    r.client.name = "Rollback client";
    r.evidence = [
      {
        field_path: "client.name",
        attachment_ids: ["ffffffff-ffff-4fff-8fff-ffffffffffff"],
      },
    ];
    await expect(
      db.query("select validate_dossier($1,$2,$3::jsonb)", [
        wa,
        aid,
        JSON.stringify(r),
      ]),
    ).rejects.toThrow();
    expect(
      (await db.query("select * from clients where name='Rollback client'"))
        .rows,
    ).toHaveLength(0);
  });
  it("snooze replaces a pending reminder and received documents create a useful verification action", async () => {
    await db.query(
      "select transition_action($1,$2,'WAITING',now()+interval '1 day')",
      [wa, actionId],
    );
    await db.query(
      "select transition_action($1,$2,'WAITING',now()+interval '3 days','SNOOZED')",
      [wa, actionId],
    );
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from reminders where action_id=$1 and sent_at is null",
          [actionId],
        )
      ).rows[0].count,
    ).toBe(1);
    await db.query("select follow_up($1,$2,'DOCUMENTS_RECEIVED')", [
      wa,
      actionId,
    ]);
    const a = (
      await db.query<{ status: string; title: string }>(
        "select status,title from actions where id=$1",
        [actionId],
      )
    ).rows[0];
    expect(a.status).toBe("TODO");
    expect(a.title).toContain("Vérifier");
  });
  it("only the service role can claim push reminders and claims are exclusive", async () => {
    await expect(db.query("select * from claim_reminders()")).rejects.toThrow();
    await db.query(
      "insert into push_subscriptions(workspace_id,user_id,endpoint,keys) values($1,$2,'https://fcm.googleapis.com/test', '{}')",
      [wa, userA],
    );
    await db.exec(
      "reset role;grant usage on schema public to service_role;set role service_role",
    );
    const claimed = await db.query("select * from claim_reminders()");
    expect(claimed.rows.length).toBeGreaterThan(0);
    expect(
      (await db.query("select * from claim_reminders()")).rows,
    ).toHaveLength(0);
    await db.exec(
      `set role authenticated;set request.jwt.claim.sub='${userA}'`,
    );
  });
  it("rate limits expensive calls and cannot consume another workspace budget", async () => {
    await expect(
      db.query("select consume_budget($1,'ai')", [wb]),
    ).rejects.toThrow();
    for (let i = 0; i < 60; i++)
      expect(
        (
          await db.query<{ ok: boolean }>(
            "select consume_budget($1,'ai') as ok",
            [wa],
          )
        ).rows[0].ok,
      ).toBe(true);
    expect(
      (
        await db.query<{ ok: boolean }>(
          "select consume_budget($1,'ai') as ok",
          [wa],
        )
      ).rows[0].ok,
    ).toBe(false);
  });
  it("preserves original AI result when corrections are validated", async () => {
    const original = manualResult("CALLBACK");
    original.client.name = "Original name";
    const aid = (
      await db.query<{ id: string }>(
        "insert into analyses(workspace_id,status,result) values($1,'READY',$2::jsonb) returning id",
        [wa, JSON.stringify(original)],
      )
    ).rows[0].id;
    const corrected = {
      ...original,
      client: { ...original.client, name: "Corrected name" },
    };
    await db.query("select validate_dossier($1,$2,$3::jsonb)", [
      wa,
      aid,
      JSON.stringify(corrected),
    ]);
    const row = (
      await db.query<{
        source_result: { client: { name: string } };
        result: { client: { name: string } };
      }>("select source_result,result from analyses where id=$1", [aid])
    ).rows[0];
    expect(row.source_result.client.name).toBe("Original name");
    expect(row.result.client.name).toBe("Corrected name");
  });
  it("memberships cannot be self-assigned and workspace cannot be moved", async () => {
    await expect(
      db.query(
        "insert into workspace_members(workspace_id,user_id) values($1,$2)",
        [wb, userA],
      ),
    ).rejects.toThrow();
    await db.exec("reset role");
    await db.query(
      "insert into workspace_members(workspace_id,user_id) values($1,$2)",
      [wb, userA],
    );
    await db.exec(
      `set role authenticated;set request.jwt.claim.sub='${userA}'`,
    );
    const c = (
      await db.query<{ id: string }>(
        "insert into clients(workspace_id,name) values($1,'Immovable') returning id",
        [wa],
      )
    ).rows[0].id;
    await expect(
      db.query("update clients set workspace_id=$1 where id=$2", [wb, c]),
    ).rejects.toThrow("Workspace is immutable");
  });
  it("bootstrap is idempotent", async () => {
    expect(
      (await db.query<{ id: string }>("select bootstrap_workspace() as id"))
        .rows[0].id,
    ).toBe(wa);
  });
});
