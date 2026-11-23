# FJ Tile Card 🎨

Une carte universelle Home Assistant Lovelace au style FJ : tuiles carrées ou horizontales, thèmes clair et sombre, icônes et états en français.

## Installation HACS

1. Dans HACS, ouvrir **Dépôts personnalisés**.
2. Ajouter `https://github.com/fredct15/fj-tile-card` en catégorie **Dashboard**.
3. Installer **FJ Tile Card**, puis actualiser le navigateur.
4. Ajouter la carte dans le tableau de bord et choisir l'entité avec l'éditeur visuel.

## Exemples YAML

### Carré
```yaml
type: custom:fj-tile-card
entity: binary_sensor.connexion_internet
name: Internet
icon: mdi:web
layout: square
tap_action: more-info
```

### Compact — comme une tuile native
```yaml
type: custom:fj-tile-card
entity: person.fred
name: Fred
show_entity_picture: true
layout: compact
grid_options:
  columns: 6
  rows: 1
```

### Horizontal
```yaml
type: custom:fj-tile-card
entity: lock.porte_arriere
name: Porte arrière
icon: mdi:lock
layout: horizontal
tap_action: more-info
```

## Options

| Option | Description |
| --- | --- |
| `entity` | Entité Home Assistant (obligatoire) |
| `name` | Nom facultatif |
| `icon` | Icône MDI facultative |
| `layout` | `square` ou `horizontal` |
| `tap_action` | `more-info` (défaut), `toggle` ou `none` |
| `active_color` | Couleur CSS facultative, ex. `#247155` |

L'action `toggle` est limitée aux domaines `light`, `switch`, `input_boolean` et `fan`. Les serrures ne sont **jamais** commandées par cette carte.

## Couleurs

Mode jour : fond `#FFFFFF`, panneau `#F0F2EF`, vert `#247155`.

Mode nuit : fond `#101412`, panneau `#171C19`, vert `#287D60`.

## Notes

Une carte affiche une entité. Pour une grille de plusieurs tuiles, utilisez la carte native **Grid** de Home Assistant et placez-y plusieurs FJ Tile Cards.

## Licence

MIT. Projet original indépendant des autres cartes FJ.

## v1.0.1
Ajout du format `compact`, de `show_entity_picture`, de `hide_state`, de la prise en charge basique de `state_content: last_changed`, et de champs supplémentaires dans l'éditeur. Les options natives `grid_options` sont conservées pour le tableau de bord. Compatibilité Mushroom/Jinja complète non encore implémentée.

## v1.2.0 — nouveautés

- Tuiles compactes : avatar de 40 px, texte principal de 14 px et secondaire de 12 px.
- Badges de présence sur les entités `person.*` : maison verte si à domicile, badge bleu ailleurs.
- Traduction de `home` en **Maison** et `not_home` en **Absent**; nom de zone quand disponible.
- Entité facultative pour une tuile informative.
- Propriétés `primary`, `secondary`, `color`, `icon_color` et `badge_icon`.
- Templates Jinja dans `primary`, `secondary`, `icon`, `color`, `badge_icon`, `badge_color`, rendus par le moteur Home Assistant via `render_template`.
- Éditeur visuel enrichi (texte secondaire et couleur).

### Exemple de tuile informative

```yaml
type: custom:fj-tile-card
primary: Encombrants
secondary: "{{ states('sensor.prochain_encombrants') }}"
icon: mdi:package-variant
color: orange
layout: compact
```

### Limites actuelles

Cette version **n'est pas une reproduction complète de Mushroom v5.3.0**. Les fonctionnalités (`features`) natives, les actions avancées (maintien, double-clic, navigation, service), les images/badges dynamiques avancés et tous les réglages de l'éditeur Mushroom ne sont pas encore intégrés. `grid_options` reste géré par le tableau de bord Home Assistant. La compatibilité doit être testée sur Home Assistant.

## v1.2.1 — correctifs
- Traduction des états `device_tracker` (`home` → Maison, `not_home` → Absent).
- Affichage « Chargement… » pendant le rendu des templates Jinja, plutôt que d'afficher leur code brut.
- Conservation des résultats de templates entre les changements de configuration et mises à jour Home Assistant.
- Limitation du débordement du texte secondaire pour préserver la hauteur des tuiles compactes.
- Syntaxe JavaScript validée; rendu réel dans Home Assistant encore à tester.

## v1.2.2 — couleurs Mushroom et titres compacts

- Les couleurs nommées (`red`, `orange`, `blue`, `pink`, etc.) utilisent les variables RGB du thème Home Assistant/Mushroom avec valeurs de repli. Les couleurs explicites restent appliquées même si l'entité est inactive.
- Nouvelle option `title_lines: 2` : titre sur deux lignes au maximum dans une tuile compacte de hauteur fixe (54 px). Le texte secondaire reste sur une seule ligne ; selon la longueur du texte, une troncature demeure possible.
- L'éditeur visuel propose désormais le nombre de lignes du titre.

```yaml
type: custom:fj-tile-card
primary: Dividendes AL 💰
secondary: Lundi 30 Nov. 2026
icon: mdi:piggy-bank
color: pink
layout: compact
title_lines: 2
```

Le rendu visuel et les couleurs exactes dépendent du thème Home Assistant ; à valider sur l'installation cible.
