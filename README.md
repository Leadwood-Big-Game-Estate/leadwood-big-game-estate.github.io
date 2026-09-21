# Leadwood Tracker

Web app (PWA) for the guides of Leadwood Big Game Estate to report animal sightings in real
time on the reserve map, shared between vehicles. Installs on the home screen and keeps working
without network.

    https://leadwood-big-game-estate.github.io

---

## Files

### In the GitHub repository (public)

```
index.html              the app (HTML + CSS + JS)
config.js               team settings: Supabase project, vehicles, display time, password hash
password.html           tool that computes the opening-password hash
manifest.json           PWA metadata
sw.js                   service worker (offline cache)
leaflet.js, leaflet.css Leaflet 1.9.4, the map engine
icon-192.png, icon-512.png, icon-maskable-512.png, favicon.ico
supabase.sql            step 1: sightings table
supabase-accounts.sql   step 2: individual accounts + private map bucket
tools/kmz2json.py       converter KMZ -> reserve.json (optional, for map updates)
README.md
```

All files sit at the root (except `tools/`). All paths are relative, so the app also works from a
sub-folder or another host.

### In Supabase Storage (private)

```
bucket "cartes" / reserve.json    reserve boundary, roads and road names
```

**Never put `reserve.json` in the repository**: the repository is public, the bucket is not. The
app only downloads it once a guide is signed in, then keeps a copy on the phone for offline use.
Signing out deletes that copy.

---

## How it works for a guide

1. Open the address in **Safari** (iPhone) or **Chrome** (Android) and add it to the home screen
   (iPhone: Share → *Add to Home Screen*; Android: ⋮ → *Install app*).
2. Pick the vehicle, type its password.
3. The map opens on their position.

| Action | Result |
|---|---|
| Pick an animal, then the green button | Sighting at the current GPS position |
| Long press on the map (animal selected) | Sighting at the chosen spot, without GPS |
| Tap a marker | Details: age, distance and direction from you, share, delete (own sightings only) |
| Tap a road | Its name (handy for the radio) |
| Layers button | Satellite ⇄ Road map |
| Target button | Follow my position; stops as soon as the map is moved by hand |

A sighting **disappears after `LW_DISPLAY_HOURS` hours** (config.js) — from the map *and* from the
sightings list. Markers fade as they age. Admins keep the full history in the exports.

### The map

- **Satellite background**: Esri World Imagery (no key). Tiles already viewed are kept on the
  phone (up to ~4,000 tiles), so browse the reserve once on Wi-Fi before going out.
- **Overlay** from `reserve.json`: Rietspruit boundary; roads (solid), two-tracks (dashed),
  "No entry for Traverse" (red dotted); road names from zoom 15.
- **Road map** mode: overlay only, works everywhere without network.

No calibration is needed: the KMZ files hold real GPS coordinates.

### Updating the roads

Export the KMZ files from Google Earth, then:

```bash
python3 tools/kmz2json.py "Rietspruit Game Reserve Boundary.kmz" "Leadwood Roads.kmz" \
        "Bloubank Roads.kmz" "Khaya Ndlovu Roads.kmz" > reserve.json
```

Upload the new `reserve.json` to Supabase (Storage → `cartes` → replace the file). Phones pick it
up the next time they open the app with network. Lines are classified from the Google Earth folder
names ("track" → two-track, "No entry" → no entry, anything else → road).

---

## config.js

Edit it on GitHub (pencil icon → *Commit changes*); phones get the change the next time they open
the app.

| Setting | Meaning |
|---|---|
| `LW_GATE_HASH` | Opening password hash (from `password.html`). Empty = no password screen. |
| `LW_SUPABASE` | Project URL + **publishable** key. Never the secret / service_role key. |
| `LW_DISPLAY_HOURS` | Hours a sighting stays visible, for the whole team. 0 = forever. |
| `LW_VEHICLES` | `{ name, email, admin? }` per vehicle account. |

The older French keys (`LW_DUREE_H`, `LW_VEHICULES`, `nom`) are still accepted.

### Accounts

**Add a vehicle:** Supabase → *Authentication → Users → Add user*, email + password, tick
*Auto Confirm User*. Then add `{ name: "Land Cruiser 4", email: "cruiser4@leadwood.local" }` to
`LW_VEHICLES`. The email never appears in the app and does not need to exist.

**Remove a vehicle / lost phone:** delete the account in Supabase (then recreate it with a new
password if needed). Changing the password alone may not close a session already open.

**Admin:** `admin: true` in `LW_VEHICLES` shows sharing setup, exports and delete. It only hides
buttons; what an account may read or change is enforced by the server.

---

## Security

- **Real protection = Supabase accounts + row-level security.** Without an account the
  publishable key gives access to nothing. Everyone signed in sees all sightings; each vehicle can
  only post under its own identity and only change its own sightings.
- **Turn off public sign-ups:** *Authentication → Sign In / Providers → Allow new users to sign
  up* = off. Otherwise anyone could create an account with the public key and read the sightings.
- **The opening password is a convenience only**: its hash is public; it keeps casual visitors out.
- **Road data is private** (Supabase bucket), downloaded only after sign-in, wiped on sign-out.
- **Git history** keeps every file ever committed (e.g. an old `carte.pdf` or `reserve.js`).
  Deleting a file does not remove it from history.
- **Retention:** sightings stay in the database. Run from time to time:
  `delete from sightings where ts < now() - interval '30 days';`
- The *Share* button sends coordinates by WhatsApp/SMS: from there they leave the app's control.

---

## Setting up from scratch

1. Supabase: new project, run `supabase.sql`, then `supabase-accounts.sql` (SQL Editor).
2. Turn off public sign-ups; create the vehicle accounts.
3. Upload `reserve.json` to Storage → `cartes`.
4. Fill in `config.js`; upload the repository files; *Settings → Pages → Deploy from a branch →
   main → / (root)*.

After changing `index.html` or `sw.js`, bump `VERSION` in `sw.js` so installed phones refresh.

---

## Dependencies

- [Leaflet](https://leafletjs.com) 1.9.4 — BSD-2 licence, in the repository.
- Esri World Imagery — attribution shown on the map. Free for moderate use; heavy commercial use
  officially requires an ArcGIS account. The road map mode does not depend on it.
- Zilla Slab and Public Sans fonts via Google Fonts (SIL OFL), with system fallback offline.
