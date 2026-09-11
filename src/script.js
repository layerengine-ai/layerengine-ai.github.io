import "dotenv/config";

const CONFIG = {
  GHL_PRIVATE_TOKEN: process.env.GHL_PRIVATE_TOKEN || "PRIVATE_INTEGRATION_TOKEN is missing",
  GHL_LOCATION_ID: process.env.GHL_LOCATION_ID || "LOCATION_ID is missing",
  SLACK_WEBHOOK_URL:
    process.env.SLACK_WEBHOOK_URL || "https://hooks.slack.com/services/XXX/YYY/ZZZ",
  // The specific pipeline you want a stage-by-stage breakdown for.
  PIPELINE_ID: process.env.GHL_PIPELINE_ID || "PIPELINE_ID",
  // How many days back to report on. 1 = "yesterday through now", 7 = weekly, etc.
  DAYS_BACK: Number(process.env.DAYS_BACK || 365),
};

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
// This endpoint family currently requires the "v3" API version, which uses
// camelCase params (locationId, pipelineId, pipelineStageId, etc.).
const GHL_API_VERSION = "v3";

function ghlHeaders() {
  return {
    Authorization: `Bearer ${CONFIG.GHL_PRIVATE_TOKEN}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
  };
}

function getDateRange(daysBack) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    startISO: start.toISOString().slice(0, 10), // YYYY-MM-DD
    endISO: end.toISOString().slice(0, 10),
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

/**
 * Fetches all pipelines for the location and returns the stages
 * (id, name, position) for the one matching pipelineId.
 */
async function getPipelineStages(pipelineId) {
  const params = new URLSearchParams({ locationId: CONFIG.GHL_LOCATION_ID });

  const res = await fetch(`${GHL_BASE_URL}/opportunities/pipelines?${params}`, {
    headers: ghlHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Get pipelines failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const pipeline = (data.pipelines || []).find((p) => p.id === pipelineId);

  if (!pipeline) {
    throw new Error(`No pipeline found with id ${pipelineId}`);
  }

  // Sort by position so the report reads top-to-bottom like the GHL UI does.
  return (pipeline.stages || []).sort((a, b) => a.position - b.position);
}

/**
 * Counts opportunities matching a status (and optionally a specific
 * pipeline/stage) within the date range. Paginates since results are
 * capped at 100 per page.
 */
async function countOpportunities({ status, pipelineId, pipelineStageId, startMs, endMs }) {
  let page = 1;
  let total = 0;
  const limit = 100;

  while (true) {
    const paramsObj = {
      locationId: CONFIG.GHL_LOCATION_ID,
      status,
      date: String(startMs),
      endDate: String(endMs),
      limit: String(limit),
      page: String(page),
    };
    if (pipelineId) paramsObj.pipelineId = pipelineId;
    if (pipelineStageId) paramsObj.pipelineStageId = pipelineStageId;

    const params = new URLSearchParams(paramsObj);

    const res = await fetch(`${GHL_BASE_URL}/opportunities/search?${params}`, {
      headers: ghlHeaders(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Opportunities search failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    const batch = data.opportunities || [];

    // Prefer the API's own total count when it provides one (via meta),
    // falling back to manual pagination counting otherwise.
    if (data.meta && typeof data.meta.total === "number") {
      return data.meta.total;
    }

    total += batch.length;
    if (batch.length < limit) break; // last page
    page += 1;
  }

  return total;
}

/**
 * Counts contacts created within the date range.
 */
async function countNewContacts(startISO, endISO) {
  const res = await fetch(`${GHL_BASE_URL}/contacts/search`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId: CONFIG.GHL_LOCATION_ID,
      filters: [
        {
          field: "dateAdded",
          operator: "range",
          value: { gte: startISO, lte: endISO },
        },
      ],
      pageLimit: 1, // we only need the total count, not the records
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Contacts search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  // HighLevel returns a "total" field alongside the contacts array.
  return data.total ?? (data.contacts ? data.contacts.length : 0);
}

async function postToSlack(message) {
  const res = await fetch(CONFIG.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Slack post failed (${res.status}): ${body}`);
  }
}

async function main() {
  const { startISO, endISO, startMs, endMs } = getDateRange(CONFIG.DAYS_BACK);

  console.log(`Pulling GHL numbers for ${startISO} -> ${endISO}...`);

  const [newContacts, openOpps, wonOpps, lostOpps, stages] = await Promise.all([
    countNewContacts(startISO, endISO),
    countOpportunities({ status: "open", startMs, endMs }),
    countOpportunities({ status: "won", startMs, endMs }),
    countOpportunities({ status: "lost", startMs, endMs }),
    getPipelineStages(CONFIG.PIPELINE_ID),
  ]);

  // const totalOpps = openOpps + wonOpps + lostOpps;
  // const conversionRate = totalOpps > 0 ? ((wonOpps / totalOpps) * 100).toFixed(1) : "0.0";

  // Get an opportunity count for each stage in the target pipeline.
  const stageCounts = await Promise.all(
    stages.map((stage) =>
      countOpportunities({
        status: "all",
        pipelineId: CONFIG.PIPELINE_ID,
        pipelineStageId: stage.id,
        startMs,
        endMs,
      }),
    ),
  );

  const stageLines = stages.map((stage, i) => `   - ${stage.name}: *${stageCounts[i]}*`).join("\n");

  const message =
    `📊 *GHL Report* (${startISO} → ${endISO})\n` +
    `• New leads/contacts: *${newContacts}*\n` +
    `• Opportunities — Open: *${openOpps}*, Won: *${wonOpps}*, Lost: *${lostOpps}*\n` +
    // `• Conversion rate: *${conversionRate}%*\n` +
    `• Pipeline stage breakdown:\n${stageLines}`;

  console.log(message);
  await postToSlack(message);
  console.log("Posted to Slack successfully.");
}

main().catch((err) => {
  console.error("Report failed:", err.message);
  process.exit(1);
});
