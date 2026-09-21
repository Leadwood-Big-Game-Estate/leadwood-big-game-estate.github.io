/* ------------------------------------------------------------------ *
 *  Leadwood Tracker — settings you can change without touching the app
 *  (edit on GitHub with the pencil icon, then "Commit changes").
 * ------------------------------------------------------------------ */

/*  App opening password.
 *
 *  Not the password itself but its SHA-256 hash. To make a new one,
 *  open  password.html  on this same site, type the password you want
 *  and copy the line it shows in place of the one below.
 *
 *  Empty string  ->  no password asked.
 *
 *  WARNING: this check runs in the browser and can be bypassed by
 *  reading the page's code. It keeps casual visitors out; the real
 *  protection is the Supabase accounts, which the server checks.
 */
window.LW_GATE_HASH = "";

/*  The reserve's Supabase project.
 *
 *  Declared here, every phone knows it automatically: the guide has
 *  nothing to set up, they pick their vehicle and type its password.
 *  The "publishable" key is meant to be public: without an account it
 *  gives access to nothing (see supabase-accounts.sql).
 *  NEVER put the "secret" / "service_role" key here.
 */
window.LW_SUPABASE = {
  url: "https://jxijcxlaadtdlefussob.supabase.co",
  key: "sb_publishable_Nd-B8xHPCT29JRP2oNMeVw_915DI8PP"
};

/*  How long a sighting stays on the map, in hours, for the whole team.
 *
 *  After that, the marker disappears from every vehicle's map and from
 *  the sightings list. Nobody can change it from the app: it is set here.
 *  0  ->  markers never disappear.
 */
window.LW_DISPLAY_HOURS = 3;

/*  The reserve's vehicles.
 *
 *  Each entry matches an account created by hand in Supabase
 *  (Authentication -> Users -> Add user, with "Auto Confirm User" ticked).
 *  The guide only sees the name: they pick their vehicle from the list
 *  and type its password. The email is only used internally and does not
 *  need to exist — no email is ever sent.
 *
 *  The name shown on sightings comes from this list.
 *
 *  Removing a vehicle here removes it from the sign-in screen but does
 *  NOT disable its account: to cut access for good, also delete the
 *  account in Supabase.
 *
 *  admin: true  ->  this account sees the administration settings
 *  (sharing setup, exports, delete). Keep it to one or two accounts.
 *
 *  Empty list  ->  the app asks for email and password instead.
 */
window.LW_VEHICLES = [
  { name: "Land Cruiser TDC", email: "tdecoster@tdecoster.eu" },
  { name: "Admin", email: "leopoldlangen@gmail.com", admin: true }
];
