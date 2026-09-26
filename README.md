# Minor Research Group website

Source for **aminor.mse.berkeley.edu**, the website of Prof. Andrew Minor's group at
UC Berkeley and Berkeley Lab (NCEM, Molecular Foundry).

The site is built with [Hugo](https://gohugo.io) (a single program, no plugins) and
published by GitHub Actions to GitHub Pages. Push a change to `main` and the live site
updates about a minute later.

It replaces a WordPress site that was compromised in 2026 after it could no longer be
maintained, so it is deliberately small: a few hundred lines of templates, one stylesheet
and three short scripts. The goal is that whoever looks after it next can read all of it
in an afternoon and keep it running for years with very little effort.

## Where things live

Almost every update is a small edit to one YAML file in `data/`. Each file starts with a
short comment that explains its fields.

| To change… | Edit |
|---|---|
| Current members | `data/people.yaml` |
| Alumni (move people here when they leave) | `data/alumni.yaml` |
| News (home page shows the newest 10 dates) | `data/news.yaml` |
| Publication list | `data/publications.yaml` (or run `scripts/update_publications.py`) |
| Journal covers above the publication list | `data/covers.yaml` |
| Research areas, selected papers, sponsors | `data/research.yaml` |
| Gallery photos | `data/gallery.yaml` |
| About text and photo on the home page | `content/_index.md` |
| Page intro sentences, contact addresses | `content/<page>.md` |
| Menu, email, site-wide settings | `hugo.toml` |
| Footer (address, logos, copyright) | `layouts/_partials/footer.html` |
| Look and layout | `assets/css/site.css`, `layouts/` |

## Common tasks

- **Add a member:** add a block to the right group in `data/people.yaml` and put the
  photo in `assets/img/people/`. Without a photo, a neutral placeholder is shown.
- **Someone graduates or leaves:** move their block to the top of `data/alumni.yaml`
  (their lines become `affiliation`; add `start`/`end` years) and add a news item.
- **News:** add at the top of `data/news.yaml` with `date: "YYYY-MM"` (in quotes).
  Paper news follows the group's rule: Science, Nature and their main sister journals,
  since 2015, with Andy as last author; add `link` with the DOI URL.
- **New papers:** see *Updating publications* below. Cover art goes in
  `data/covers.yaml` plus `assets/img/covers/`.
- **New page:** add `content/<name>.md` (it renders with `layouts/page.html`) and, if it
  belongs in the menu, a `[[menus.main]]` entry in `hugo.toml`.

### Adding a photo

Put the image in the matching folder under `assets/img/` (`people/`, `gallery/`,
`covers/`, `research/`, `site/`) and refer to it in the YAML by its path under
`assets/img/`, for example `people/jane-doe.jpg`. Any size or format (JPG, PNG, WebP)
works; Hugo resizes and converts it when the site is built. Keep originals under about
3000 px so the repository stays small.

### Updating publications

Google Scholar has no API, so new papers come from OpenAlex, matched on Andy's ORCID:

```sh
pip install pyyaml
python3 scripts/update_publications.py --dry-run   # see what would be added
python3 scripts/update_publications.py             # add them
```

The script only adds entries; it never changes or removes existing ones. Check the new
entries (especially `type`) before committing.

## Previewing locally

Install Hugo 0.166.0 or newer, then from this folder:

```sh
hugo server
```

and open http://localhost:1313. The page reloads as you save files. On a Mac without
Homebrew, install Hugo from the `.pkg` on the
[Hugo releases page](https://github.com/gohugoio/hugo/releases).

## Publishing

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site with the
pinned Hugo version and deploys it to GitHub Pages.

One-time setup for a new repository:

1. Push this folder to `main` of a repository owned by the group's GitHub organization
   (with Andy as an owner, so the site outlives any one student).
2. In the repository, go to **Settings → Pages → Build and deployment** and set
   **Source** to **GitHub Actions**.
3. For the custom domain: ask MSE IT to point `aminor.mse.berkeley.edu` (CNAME) at
   `<organization>.github.io`, then enter the domain under **Settings → Pages → Custom
   domain** and turn on **Enforce HTTPS**.

## Folder structure

```
hugo.toml                 baseURL, menu (top nav + footer "Explore"), params (email, Scholar URL)
content/_index.md         home: About text (body) + about_photo
content/<page>.md         title, layout, lead sentence; contact.md also holds the two offices
data/people.yaml          leader + groups (Staff, Postdoctoral Fellows, Graduate Students, ...)
data/alumni.yaml          flat list, most recent first; start/end years, affiliation, email, photo
data/news.yaml            newest first; same-date items are merged into one timeline entry
data/publications.yaml    full list from Google Scholar; type = article|abstract|preprint|other
data/covers.yaml          journal covers above the publication list
data/research.yaml        areas (banner, text, selected papers, optional home tile) + sponsors
data/gallery.yaml         photos with year, caption, feature (full-width group photo)
layouts/baseof.html       page shell (head, header, main, footer, scripts)
layouts/<page>.html       one template per page: home, research, people, alumni,
                          publications, news, gallery, contact; page.html = plain markdown page
layouts/_partials/        header, footer, head, image (resize helper), news-timeline,
                          gallery-photo, page-intro, people-tabs
assets/css/site.css       the only stylesheet
assets/js/site.js         mobile menu; alumni search + 10-per-page pager
assets/js/publications.js article/all toggle, year menu, search, 20-per-page pager
                          (data is injected by publications.html as window.PUBS)
assets/js/gallery.js      justified photo rows + photo viewer
assets/img/               original images (resized automatically at build time)
static/                   favicon.svg/.ico + apple-touch-icon.png, copied as-is
scripts/update_publications.py   adds new papers from OpenAlex (Andy's ORCID)
.github/workflows/        build and deploy to GitHub Pages
```

## Maintainer notes

### Ground rules

1. **Content is data.** Lists live in `data/*.yaml`; page text lives in `content/*.md`.
   Adding a person, paper, news item or photo should never require editing a template.
   Keep the comment at the top of each YAML file accurate when a field changes.
2. **Keep it small.** No npm, Hugo modules, themes, frameworks or build tools. If a
   feature needs one, it probably doesn't belong on this site.
3. **One stylesheet.** `assets/css/site.css`, organized by page, with colors and fonts
   as tokens in `:root` (Berkeley Blue `#002676`, California Gold `#FDB515`).
4. **Design language.** Clean and restrained, not animated. Things line up: fixed-height
   rows, one-line text where possible, no endless scrolling (long lists are paginated).
5. **No secrets in the repository.** It may be public.

### Images

Templates never link `assets/img` files directly; they go through
`partial "image.html" (dict "src" "people/x.jpg" "width" 900)` (or `"square" 480` for
headshots), which scales an image down only when the original is larger. Gallery photos
get a 900 px thumbnail and an 1800 px version for the viewer. The workflow caches
processed images in `resources/` (not committed).

### Checking your work

```sh
hugo server                  # preview at http://localhost:1313
hugo --gc --minify           # must finish with no errors or warnings
```

Look at every page you touched at desktop width and at about 390 px (phone): no
horizontal scrolling, rows still line up, nothing wraps that used to fit on one line.
Also check the build under a sub-path, as GitHub Pages serves it before the custom domain
is set: `hugo server --baseURL http://localhost:1313/aminor-website/`. All links use
`relURL` or `.RelPermalink`, never hard-coded `/paths`.

### Upgrading Hugo

Change `HUGO_VERSION` in the workflow and `min` in `hugo.toml` together, build locally,
and fix any deprecation warnings before pushing. The templates use the Hugo 0.146+ layout
structure (`layouts/_partials`, `layouts/home.html`, `hugo.Data`).

## What does not belong here

- **Publication PDFs.** Most publishers do not allow hosting them. Link the DOI instead.
- **Videos.** Put them on YouTube or Vimeo and link them.
- **Raw research data.** Deposit it on Zenodo (it gets a DOI) and link it.
- **Passwords or keys.** Never commit them.
