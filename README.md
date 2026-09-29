# LayerEngine website

This repository contains the static LayerEngine website served through GitHub Pages and Cloudflare. The public site has **no build step and no required environment variables**.

## Run the website locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). This serves `index.html` and all linked static assets locally.

## Optional: GHL-to-Slack reporting utility

`src/script.js` is separate from the public website. It queries GoHighLevel opportunity/contact data and posts a report to Slack. It needs environment variables only when this optional utility is run.

```bash
cp .env.example .env
npm install
npm start
```

Populate the following values in `.env` before running it:

| Variable | Purpose |
| --- | --- |
| `GHL_PRIVATE_TOKEN` | GoHighLevel private integration token used for the API calls. |
| `GHL_LOCATION_ID` | GoHighLevel sub-account / location ID. |
| `GHL_PIPELINE_ID` | Pipeline included in the stage-by-stage report. |
| `SLACK_WEBHOOK_URL` | Incoming Slack webhook used to deliver the report. |
| `DAYS_BACK` | Optional reporting window in days; defaults to `365`. |

> Keep `.env` private. It is intentionally ignored by Git. Share production credentials only through an approved secure channel, preferably by issuing a new least-privilege token and a dedicated webhook for the person or environment that needs access.
