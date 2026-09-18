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
window.LW_GATE_HASH = "839d66354adb5398982369c77725b29c0eef948308953aec3c73186f712fcb79";
