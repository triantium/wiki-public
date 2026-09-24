---
publish: true
created: 2026-09-24T13:28:02.578Z
modified: 2026-09-24T14:47:03.241Z
title: Wiki
---

# Willkomen im Reich des begrenzten Wissens

```base
views:
  - type: table
    name: Table
    filters:
      and:
        - publish == true
    order:
      - file.name
      - file.tags
    sort:
      - property: file.path
        direction: ASC

```
