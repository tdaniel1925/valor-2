import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("🔍 Checking SmartOffice data...\n");

  // Get all tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, slug, name");

  console.log("📊 Tenants found:", tenants?.length || 0);
  tenants?.forEach(t => console.log(`  - ${t.name} (${t.slug})`));

  console.log("\n");

  // Check SmartOffice policies for each tenant
  for (const tenant of tenants || []) {
    const { data: policies, count } = await supabase
      .from("smart_office_policies")
      .select("*", { count: "exact", head: false })
      .eq("tenant_id", tenant.id)
      .limit(5);

    console.log(`📋 SmartOffice Policies for "${tenant.name}" (${tenant.slug}):`);
    console.log(`   Total: ${count || 0}`);

    if (policies && policies.length > 0) {
      console.log(`   Sample policies:`);
      policies.forEach((p: any) => {
        console.log(`     - ${p.policy_number}: ${p.primary_insured} - ${p.carrier_name}`);
      });
    } else {
      console.log(`   ⚠️  No policies found`);
    }
    console.log("");
  }

  // Check SmartOffice agents
  for (const tenant of tenants || []) {
    const { data: agents, count } = await supabase
      .from("smart_office_agents")
      .select("*", { count: "exact", head: false })
      .eq("tenant_id", tenant.id)
      .limit(5);

    console.log(`👤 SmartOffice Agents for "${tenant.name}" (${tenant.slug}):`);
    console.log(`   Total: ${count || 0}`);

    if (agents && agents.length > 0) {
      console.log(`   Sample agents:`);
      agents.forEach((a: any) => {
        console.log(`     - ${a.full_name} (${a.email})`);
      });
    } else {
      console.log(`   ⚠️  No agents found`);
    }
    console.log("");
  }

  // Check sync logs
  const { data: syncLogs } = await supabase
    .from("smart_office_sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  console.log(`📝 Recent SmartOffice Sync Logs: ${syncLogs?.length || 0}`);
  syncLogs?.forEach((log: any) => {
    console.log(`  - ${log.sync_type}: ${log.status} (${log.records_created} created, ${log.records_updated} updated)`);
  });
}

main().catch(console.error);
