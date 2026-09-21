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
window.LW_GATE_HASH = "";

/*  Projet Supabase de la réserve.
 *
 *  Renseigné ici, chaque téléphone le connaît d'office : le guide n'a rien
 *  à configurer, il choisit son véhicule et tape son mot de passe.
 *  La clé « publishable » est faite pour être publique : elle ne donne
 *  accès à rien sans compte, les données étant protégées par les
 *  politiques de sécurité (script supabase-comptes.sql).
 *  Ne JAMAIS mettre ici la clé « secret » / « service_role ».
 */
window.LW_SUPABASE = {
  url: "https://jxijcxlaadtdlefussob.supabase.co",
  key: "sb_publishable_Nd-B8xHPCT29JRP2oNMeVw_915DI8PP"
};

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
 *  admin: true  ->  ce compte voit les réglages d'administration :
 *  carte, calage GPS, exports, effacement, configuration du partage.
 *  Sans ce drapeau, le guide n'a que l'affichage et sa déconnexion.
 *  Réservez-le à un ou deux comptes.
 *
 *  Liste vide  ->  l'app redemande l'adresse e-mail et le mot de passe.
 */
window.LW_VEHICULES = [
  { nom: "Land Cruiser TDC", email: "tdecoster@tdecoster.eu" },
  { nom: "Land Cruiser LEOPOLD", email: "leopoldlangen@gmail.com" },
  { nom: "Land Cruiser 3", email: "cruiser3@leadwood.local" },
  { nom: "Réserve — bureau", email: "bureau@leadwood.local", admin: true }
];
