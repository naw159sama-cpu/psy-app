/**
 * Les deux coordonnées du coffre en ligne.
 *
 * Elles se relèvent dans Supabase : Project Settings → API.
 * La marche à suivre complète est dans docs/mise-en-service.md.
 *
 * La clé « anon » est faite pour être publique : elle voyage dans le code de
 * toute application Supabase et ne donne accès à rien par elle-même. Ce sont
 * les règles posées dans supabase/schema.sql, appliquées par PostgreSQL, qui
 * protègent les dossiers.
 *
 * La clé « service_role » n'a rien à faire ici, ni nulle part ailleurs dans ce
 * dépôt : elle passe outre toutes les règles.
 */

export const NUAGE_URL = ''
export const NUAGE_CLE = ''

/**
 * Tant que les deux valeurs sont vides, l'application travaille en local seul,
 * exactement comme avant le coffre. Aucun écran de connexion, aucune perte de
 * fonction : c'est ce qui permet de publier avant d'avoir créé la base.
 */
export function coffreConfigure(): boolean {
  return NUAGE_URL.trim().length > 0 && NUAGE_CLE.trim().length > 0
}
