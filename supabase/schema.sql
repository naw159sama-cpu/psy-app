-- =========================================================================
--  Le coffre : la base de données de l'application
--
--  À coller une seule fois dans l'éditeur SQL de Supabase
--  (menu de gauche : « SQL Editor » → « New query » → coller → « Run »).
--
--  Deux tables, et rien de plus :
--    coffre             le dossier vivant, celui que l'application lit et écrit
--    coffre_historique  les copies datées, au cas où
--
--  La sécurité tient en une règle, appliquée par PostgreSQL lui-même :
--  personne ne peut lire ou écrire une ligne qui ne lui appartient pas.
--  Ce n'est pas l'application qui décide — c'est la base.
-- =========================================================================


-- ---------------------------------------------------------------------
--  Le dossier vivant
-- ---------------------------------------------------------------------

create table if not exists public.coffre (
  utilisateur uuid primary key references auth.users (id) on delete cascade,
  -- Tout le cabinet, dans un seul document : patients, séances, réglages.
  document jsonb not null,
  -- Compteur d'écriture. Il sert à refuser une modification faite à partir
  -- d'une version périmée, plutôt que d'écraser en silence.
  version bigint not null default 1,
  maj_le timestamptz not null default now()
);

alter table public.coffre enable row level security;

drop policy if exists "chacun ne voit que son coffre" on public.coffre;
create policy "chacun ne voit que son coffre"
  on public.coffre
  for all
  to authenticated
  using (auth.uid() = utilisateur)
  with check (auth.uid() = utilisateur);


-- ---------------------------------------------------------------------
--  Les copies datées
-- ---------------------------------------------------------------------

create table if not exists public.coffre_historique (
  id bigint generated always as identity primary key,
  utilisateur uuid not null references auth.users (id) on delete cascade,
  document jsonb not null,
  -- « jour » : la copie automatique d'une journée de travail.
  -- « conflit » : l'état qui allait être écrasé par une autre version.
  motif text not null default 'jour',
  cree_le timestamptz not null default now()
);

create index if not exists coffre_historique_utilisateur_date
  on public.coffre_historique (utilisateur, cree_le desc);

alter table public.coffre_historique enable row level security;

drop policy if exists "chacun ne voit que son historique" on public.coffre_historique;
create policy "chacun ne voit que son historique"
  on public.coffre_historique
  for all
  to authenticated
  using (auth.uid() = utilisateur)
  with check (auth.uid() = utilisateur);


-- ---------------------------------------------------------------------
--  Ménage : les copies quotidiennes ne s'accumulent pas indéfiniment.
--  Celles nées d'un conflit sont gardées, elles : elles sont rares et
--  ce sont précisément celles dont on peut avoir besoin.
-- ---------------------------------------------------------------------

create or replace function public.purger_historique()
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.coffre_historique
   where utilisateur = auth.uid()
     and motif = 'jour'
     and cree_le < now() - interval '180 days';
$$;

grant execute on function public.purger_historique() to authenticated;
