# Year Dots

One dot per day of the year. Tap a day to mark it; the count and the bar track progress
towards a goal of 100 days.

Live at **https://daily25.github.io/year-dots/** (GitHub Pages, served from `main`).

## Reading the data from somewhere else

Marked days are stored in Supabase, one row per year, and can be read by anything that can
fetch a URL. No headers needed — the key goes in the query string:

```
https://urjvspdwwjulujljxphh.supabase.co/rest/v1/year_dots?select=*&apikey=sb_publishable_Y1MTn4be6XF-WZjhgfIHkw_2MEzE53x
```

Add `&year=eq.2026` for a single year. The response is a JSON array:

```json
[
  {
    "year": 2026,
    "days": ["2026-01-03", "2026-01-07", "2026-01-08"],
    "day_count": 3,
    "updated_at": "2026-08-23T09:14:22.101Z"
  }
]
```

| field | meaning |
| --- | --- |
| `year` | the year the row covers |
| `days` | every marked day, `YYYY-MM-DD`, sorted |
| `day_count` | how many days are marked — derived, always matches `days` |
| `updated_at` | when the app last wrote this row |

Handy variants: `&select=days` for the dates alone, `&select=day_count` for just the total.

## How saving works

The app saves to `localStorage` first and to Supabase second, so it stays instant and keeps
working with no signal. When the network is unavailable, the screen shows
`offline — saved on this device` and the change is sent on the next visit.

Reconciling a device against the server:

- **The server has no row yet** — this device's days are uploaded.
- **Days saved before syncing existed** carry no timestamp, so they can't be ordered against
  the server. They are unioned with whatever is there rather than one side winning, so a
  first sync can never drop days that exist on only one side.
- **Otherwise** the more recently written copy wins, which is what makes unmarking a day
  propagate rather than reappearing from the other side.

## A note on the key

`sb_publishable_…` is a publishable key: it is meant to ship in the page, and row-level
security decides what it can do. On `year_dots` that is read, insert, and update — deletes
are refused, and a row can hold at most 366 days.

There is no login, so that key allows anonymous writes. Anyone who has the URL can change
the data. That is a deliberate trade for a personal tracker with no accounts; the fix, if it
ever matters, is Supabase Auth and a policy scoped to the signed-in user.

## Layout

Column count and dot size are computed at runtime (`pickLayout` in `app.js`): the dots are
made as large as the space allows, ties broken towards a well-proportioned block whose last
row isn't left mostly empty. Whatever is left over on the final row is centred.

## Deploying

Pushing to `main` publishes. GitHub Pages serves these files with `cache-control: max-age=600`,
so **bump `?v=` in `index.html` and `ASSET_VERSION` in `sw.js` whenever `app.js` or
`index.css` changes** — otherwise a browser can pair new markup with a cached older script,
which renders the page's static skeleton and no dots.
