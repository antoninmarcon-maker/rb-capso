## Projet collaboratif

**Plusieurs développeurs travaillent sur ce repo.** Avant toute session de modif :

1. `git pull --ff-only` obligatoire pour récupérer le travail des autres
2. Commits atomiques avec messages clairs (lus par les autres devs)
3. Jamais de force-push sur `main`
4. Pas de refactor large sans concertation

Voir `tasks/lessons.md` pour le détail.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
