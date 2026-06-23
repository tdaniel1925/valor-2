// Seed valor-2 with Phil Resch's FULL Valor Financial org from Apex's SmartOffice feed.
// Carries the COMPLETE raw record (every field) so the Valor app can present anything.
// Idempotent: deletes prior apex-sourced rows for the Valor tenant, then inserts.
const { createClient } = require('./node_modules/@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const u = k => (fs.readFileSync('./.env.local','utf8').match(new RegExp('^'+k+'=(.*)$','m'))||[])[1]?.trim().replace(/^["']|["']$/g,'');
const supabase = createClient(u('NEXT_PUBLIC_SUPABASE_URL'), u('SUPABASE_SERVICE_ROLE_KEY'));
const TENANT='valor-default-tenant', SRC='apex-smartoffice-sync', now=new Date().toISOString();
const A = JSON.parse(fs.readFileSync('C:/dev/1 - Apex Pre-Launch Site/_valor-export-agents.json','utf8'));
const P = JSON.parse(fs.readFileSync('C:/dev/1 - Apex Pre-Launch Site/_valor-export-policies.json','utf8'));
const statusMap={'1':'Active','2':'Inactive','3':'Terminated','7':'Pending'};
// Map Apex product types -> valor-2 enum {LIFE, ANNUITY, OTHER}. Real type kept in additionalData.
const ANN=new Set(['EIA','FPDA','SPDA','DIA','Single Premium','Fixed','Indexed','Flexible Premium']);
const LIFE=new Set(['IUL','UL','WL','SUL','GUL','COL','Term','Traditional']);
const polType = t => !t ? 'OTHER' : ANN.has(t)?'ANNUITY' : LIFE.has(t)?'LIFE' : 'OTHER';
// SSN minimization: never seed a full SSN. Keep only last-4 (non-NPN fallback id),
// and scrub the full TaxID out of the raw record too.
const last4 = v => { const d = String(v||'').replace(/[^0-9]/g,''); return d.length>=4 ? d.slice(-4) : null; };
const scrubRaw = raw => {
  if (!raw || typeof raw!=='object' || !raw.Contact || typeof raw.Contact!=='object') return raw||{};
  if (String(raw.Contact.TaxID||'').replace(/[^0-9]/g,'').length < 9) return raw;
  return { ...raw, Contact: { ...raw.Contact, TaxID: last4(raw.Contact.TaxID) } };
};

(async () => {
  await supabase.from('smartoffice_agents').delete().eq('tenantId',TENANT).eq('sourceFile',SRC);
  await supabase.from('smartoffice_policies').delete().eq('tenantId',TENANT).eq('sourceFile',SRC);

  const agentRows = A.map(a => ({
    id: crypto.randomUUID(), tenantId: TENANT,
    firstName: a.first_name||'', lastName: a.last_name||'',
    fullName: `${a.first_name||''} ${a.last_name||''}`.trim(),
    email: (a.email||'').toLowerCase()||null,
    phones: a.phone?[a.phone]:[], ssn: last4(a.tax_id), npn: null,
    supervisor: a.raw_data?.Supervisor?.LastName || a.supervisor_name || null,
    subSource: a.sub_source||null, sourceFile: SRC,
    additionalData: { apexContactId:a.contact_id, apexSmartofficeId:a.smartoffice_id, source:a.source, subSource:a.sub_source, status:statusMap[a.status]||a.status, statusCode:a.status, clientType:a.client_type, supervisorName:a.supervisor_name, supervisorId:a.raw_data?.Supervisor?._id, apexAgentId:a.apex_agent_id, syncedAt:a.synced_at },
    rawData: scrubRaw(a.raw_data),
    searchText: `${a.first_name||''} ${a.last_name||''} ${a.email||''}`.toLowerCase(),
    importDate: now, lastSyncDate: now, createdAt: now, updatedAt: now,
  }));
  let ok=0;
  for(let i=0;i<agentRows.length;i+=200){ const {error}=await supabase.from('smartoffice_agents').insert(agentRows.slice(i,i+200)); if(error)console.log('agent err@',i,error.message); else ok+=Math.min(200,agentRows.length-i); }
  console.log('agents inserted:', ok,'/',agentRows.length);

  // dedupe by policyNumber + skip numbers already present (global unique constraint); default productName (NOT NULL)
  let existing=new Set(), pf=0;
  while(true){ const {data}=await supabase.from('smartoffice_policies').select('policyNumber').range(pf,pf+1000-1); if(!data||!data.length)break; data.forEach(r=>r.policyNumber&&existing.add(r.policyNumber)); pf+=1000; if(data.length<1000)break; }
  const localSeen=new Set(); const polRows=[];
  for(const p of P){ const num=p.policy_number; if(!num||localSeen.has(num)||existing.has(num))continue; localSeen.add(num);
    polRows.push({ id:crypto.randomUUID(), tenantId:TENANT, policyNumber:num, primaryAdvisor:p.primary_advisor_name||null,
      productName:p.product_name||p.product_type||'Unknown', carrierName:p.carrier_name||null, primaryInsured:p.insured_name||null,
      type:polType(p.product_type), status:p.policy_status_text||null, statusDate:p.status_date||null,
      targetAmount:Number(p.annual_premium)||0, commAnnualizedPrem:Number(p.comm_ann_prem)||0, sourceFile:SRC,
      additionalData:{apexAdvisorContactId:p.primary_advisor_contact_id, apexSmartofficeId:p.smartoffice_id, apexProductType:p.product_type, holdingType:p.holding_type_name, issueDate:p.issue_date, effectiveDate:p.effective_date, annualPremium:p.annual_premium},
      rawData:p.raw_data||{}, searchText:`${num} ${p.primary_advisor_name||''} ${p.carrier_name||''}`.toLowerCase(),
      importDate:now, lastSyncDate:now, createdAt:now, updatedAt:now }); }
  let pok=0;
  for(let i=0;i<polRows.length;i+=200){ const {error}=await supabase.from('smartoffice_policies').insert(polRows.slice(i,i+200)); if(error)console.log('policy err@',i,error.message.slice(0,70)); else pok+=Math.min(200,polRows.length-i); }
  console.log('policies inserted:', pok,'/',polRows.length);
})().catch(e=>console.log('FATAL', e.message));
