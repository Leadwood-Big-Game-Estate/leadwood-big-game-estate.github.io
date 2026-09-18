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
