-- La convention de /stats est "utm_campaign null = campagne non tracee".
-- Une chaine vide contourne cette convention: elle passe pour une campagne
-- tracee, ne matche aucune session GA4, et affiche un faux "0 demande" au
-- lieu de l'avertissement "non tracee". La contrainte ferme la porte au
-- niveau de la base, quel que soit le client qui ecrit.

update campagnes set utm_campaign = null
where utm_campaign is not null and length(trim(utm_campaign)) = 0;

alter table campagnes drop constraint if exists campagnes_utm_non_vide;
alter table campagnes add constraint campagnes_utm_non_vide
  check (utm_campaign is null or length(trim(utm_campaign)) > 0);
