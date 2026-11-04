# Metal AM decision support tools

> [!IMPORTANT]
> **AI disclosure.** This site was produced with substantial help from Claude, an AI model made by Anthropic. The author set the research question, scope and scoring columns. The AI searched public sources, identified the tools, wrote the ratings, rating notes and report text, and built the website code. Every rating then went through an adversarial AI review: one agent argued for each rating, a second tried to overturn it, and a third ruled from the sources. Every Partial that rested on a mention or claim rather than on the tool's own method was then re-ruled by two independent agents, with a third settling disagreements. Ratings and summaries may still contain errors or miss newer information, so check the linked sources before relying on any rating.

A static website with two pages:

- **`index.html`: Metal AM Tool Coverage Matrix.** 215 decision support tools for metal additive manufacturing (tools where a source shows metal AM is in scope, plus AM tools whose sources don't say, which are tagged "Metal not stated"; polymer-only studies and general-purpose tools are excluded), each rated Yes / Partial / No / Unknown on four costs (NRE, production, qualification, QA per-part inspection) and four benefits (storage, shared capital, shared capacity, value of speed). Each entry is typed as a Tool (software, spreadsheets, calculators, quantitative models, worksheets) or a Framework (a way to think about the problem: qualitative methods, standards, guidance). Search, filter by type, decision level, setting, confidence and metal AM scope, sort, and expand a row for rating notes, the tool link and sources; the table header stays in view while you scroll. The **Filter by cost and benefit** panel is both a chart and the column filter: a triangular heat map counts the shown tools that cover each pair of columns (shaded by share), and to its right each column has a row with its rating bar and counts (Yes, Partial, Unknown, No); hover a row for the column's definition. A 2 × 2 box in the empty corner of the triangle splits the shown tools into those covering at least one cost and at least one benefit, a cost only, a benefit only, or neither. Select rows to filter by one or more columns, a cell to filter by a pair, or a corner box to filter by that split (the heat map and bars then show only that box's tools); the "rated" buttons set which ratings count as covered.
- **`report.html`: Metal AM Decision Support Tools report.** Findings, gaps and a proposed integration framework. Open it from the **Read report** button at the top of the matrix.

It is plain HTML, CSS and JavaScript with no build step and no server code, so GitHub Pages can host it as-is.

## Publish on GitHub Pages

1. Create a repository on GitHub. GitHub Pages works on public repositories on every plan; private repositories need a paid plan.
2. Upload everything in this folder to the root of the repository, keeping the `assets/` and `data/` folders. On github.com, **Add file → Upload files** and drag the folder contents in, then commit.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute or two the site is live at `https://<your-user-name>.github.io/<repository-name>/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files exactly as they are.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The matrix page |
| `report.html` | The report page |
| `assets/site.css` | Styles shared by both pages (light and dark themes) |
| `assets/matrix.js` | Filtering, sorting and row details for the matrix |
| `data/tools.js` | The tool data the matrix loads |
| `data/tools.json`, `data/tools.csv` | The same data as downloads, linked from both pages |

## Sharing a filtered view

The matrix keeps its filters in the page address, so a filtered view can be bookmarked or shared. For example, `index.html#cols=QA_Qual,Speed&match=any&min=partial` shows tools that cover qualification or speed, counting Partial ratings. Column and corner-box selections made in the matrix are saved the same way (for example `#cb=both`).

## Updating the data

`data/tools.js` holds the data as `window.TOOLS_DATA = {...}`; each tool has its ratings, notes, sources and tool link. If you edit it, update `tools.json` and `tools.csv` too so the downloads match.

Ratings were re-checked against their sources in November 2026 under the written rating rules in the report (Scope and scoring method → Rating rules). All 224 tools reviewed, including 80 that an earlier metal-only pass had cut, then went through an adversarial review by advocate, skeptic and judge agents; 9 polymer-only or general-purpose tools were dropped, leaving 215. Tool links were re-checked at the same time. Finally, the two kinds of Partial (quantified and qualitative) were merged into one stricter Partial: the tool prices part of an item or uses it as a criterion in its decision. Each of the 619 former qualitative Partials was re-ruled by two independent reviewer agents, with a judge on the 41 they disagreed on; 185 stayed Partial, 202 became No and 232 became Unknown.
