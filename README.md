# SDG site — plain HTML / CSS / JS

No framework, no subscription. Open `index.html` through any static server, e.g.

    python3 -m http.server 8800        # then visit http://localhost:8800

## Pages
| URL | File |
|---|---|
| `/` | `index.html` (hero, goals wheel, scroll text, year wheel, world map, live news, quiz) |
| `/global_goals/` | `global_goals/index.html` (17 goal cards + FAQ) |
| `/global_goals/goal-1/` … `goal-17/` | one page per goal (banner animation, intro, targets, contribute cards, other goals, live news) |
| `/legal/privacy-policy/`, `/legal/terms-of-use/` | legal pages |

## Content (your CMS, no longer in Framer)
All content is plain JSON in `data/`, one file per entry, and every image is saved in `assets/media/`:

* `data/goals/goal-1.json` … `goal-17.json` — title, intro, colour, images, targets, "how to contribute" cards
* `data/yearwise/2015.json` … — the yearly progress scores (17 values per year)
* `data/legal/*.json` — privacy policy and terms

Edit a file, then rebuild the pages:

    python3 build.py

## Hosting and editing: all on GitHub (free)
* **Code and content** live in one GitHub repository (`harshilbhandari23/sdg-global-goals`).
* **Hosting** is GitHub Pages. `.github/workflows/pages.yml` runs `python3 build.py` and publishes the site on every push to `main`.
* **Editor:** open `https://harshilbhandari23.github.io/sdg-global-goals/admin/` and sign in with a GitHub
  *personal access token* (fine-grained, this repository only, permission **Contents: read and write**).
  Create one at https://github.com/settings/personal-access-tokens/new . Edit a goal, press *Save*; the editor commits to GitHub,
  and the site rebuilds in about a minute. (Only people with write access to the repository can edit.)
* To change code or content by hand, edit the files in the repository (or locally, then `git push`).

## Automatic data
* `tools/fetch_news.py` refreshes the live news; `tools/fetch_yearwise.py` refreshes the "Progress over the years" wheel from the
  SDSN Sustainable Development Report (it finds the newest `database_<year>.xlsx` on dashboards.sdgindex.org, recomputes
  `data/yearwise.json`, and a new year shows up by itself). Both run every 3 hours in GitHub Actions; if a source is down the
  existing data is kept.

## Interactions
* `assets/ui.js` — floating nav, clickable goals wheel (17 exact pie slices), FAQ, scroll colour text, count-up numbers
* `assets/widgets.js` — draggable year wheel, live news carousel, quiz
* `assets/map.js` — world map (SDSN ratings, UN SDG API fallback for unranked areas)
* `assets/heroes/` — the 17 goal banner animations

## Notes
* The quiz can post results to your own endpoint: add `data-webhook="https://…"` to the `.quiz` element in `build.py`.
* Live data comes from `sdg-middleware.vercel.app` (ratings, news) and `unstats.un.org/SDGAPI`.
