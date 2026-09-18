/* ------------------------------------------------------------------ *
 *  Leadwood Tracker — réglages modifiables sans toucher à l'application
 * ------------------------------------------------------------------ */

/*  Mot de passe d'ouverture de l'application.
 *
 *  On ne met pas le mot de passe ici, mais son empreinte SHA-256.
 *  Pour en calculer une nouvelle, ouvrez la page  motdepasse.html
 *  de ce même site, tapez le mot de passe voulu, et recopiez la ligne
 *  qu'elle affiche à la place de celle ci-dessous.
 *
 *  Chaîne vide  ->  aucun mot de passe demandé.
 *
 *  ATTENTION : ce contrôle s'exécute dans le navigateur et peut être
 *  contourné en lisant le code de la page. Il écarte le passant qui
 *  tombe sur l'adresse ; la vraie protection, ce sont les comptes
 *  Supabase, qui eux sont vérifiés par le serveur.
 */
window.LW_GATE_HASH = "b7838bdcc707e9a01070b6a81c61d578e650d54f8423d3f672c96ad089342f5a";

/*  Véhicules de la réserve.
 *
 *  Chaque entrée correspond à un compte créé à la main dans Supabase
 *  (Authentication → Users → Add user, avec « Auto Confirm User » coché).
 *  Le guide ne voit que le nom : il choisit son véhicule dans la liste et
 *  tape son mot de passe. L'adresse ne sert qu'en interne et n'a pas besoin
 *  d'exister réellement — aucun courriel n'est jamais envoyé.
 *
 *  Le nom affiché sur les signalements vient de cette liste.
 *
 *  Retirer un véhicule ici le fait disparaître de l'écran de connexion,
 *  mais NE désactive pas son compte : pour couper l'accès pour de bon,
 *  supprimez aussi le compte dans Supabase.
 *
 *  Liste vide  ->  l'app redemande l'adresse e-mail et le mot de passe.
 */
window.LW_VEHICULES = [
  { nom: "Land Cruiser 1", email: "cruiser1@leadwood.local" },
  { nom: "Land Cruiser 2", email: "cruiser2@leadwood.local" },
  { nom: "Land Cruiser 3", email: "cruiser3@leadwood.local" },
  { nom: "Réserve — bureau", email: "bureau@leadwood.local" }
];
