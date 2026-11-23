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
