---
publish: true
created: 2026-09-30T14:54:15.695Z
modified: 2026-09-30T15:04:05.598Z
---

```base
views:
  - type: table
    name: Table
    filters:
      or:
        - ORG == link(this.file)
        - ORG[OTHER] == == link(this.file)
    order:
      - file.name
      - title
      - ROLE
    sort:
      - property: EMAIL[WORK,home]
        direction: ASC
      - property: EMAIL[WORK,pref]
        direction: ASC
      - property: FN
        direction: ASC
      - property: EMAIL[home]
        direction: ASC

```
