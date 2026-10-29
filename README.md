# Metal AM decision support tools

> [!IMPORTANT]
> **AI disclosure.** This site was produced with substantial help from Claude, an AI model made by Anthropic. The author set the research question, scope and scoring columns. The AI searched public sources, identified the tools, wrote the ratings, rating notes and report text, and built the website code. A separate AI review pass re-checked a sample of the ratings against their sources. Ratings and summaries may still contain errors or miss newer information, so check the linked sources before relying on any rating.

A static website with two pages:

- **`index.html`: Metal AM Tool Coverage Matrix.** 224 decision support tools for metal additive manufacturing, each rated Yes / Partial / No / Unknown on four costs (NRE, production, QA qualification, QA per-part inspection) and four benefits (storage, shared capital, shared capacity, value of speed). Filter by any combination of columns, search, sort, and expand a row for rating notes, the tool link and sources.
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

The matrix keeps its filters in the page address, so a filtered view can be bookmarked or shared. For example, `index.html#cols=QA_Qual,Speed&match=any&min=partial` shows tools that cover qualification or speed, counting Partial ratings.

## Updating the data

`data/tools.js` holds the data as `window.TOOLS_DATA = {...}`; each tool has its ratings, notes, sources and tool link. If you edit it, update `tools.json` and `tools.csv` too so the downloads match.

Ratings reflect public documentation as of October 2026.