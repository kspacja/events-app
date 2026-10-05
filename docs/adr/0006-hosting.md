---
status: accepted
---

# Hosting: Vercel, Neon, osobny host dla workera

Trzy aplikacje Next.js (`apps/portal`, `apps/studio`, `apps/moderation`) hostujemy na Vercelu, a Postgresa z pgvector na Neonie. `apps/worker` stoi na osobnym hoście (na start Railway albo Fly.io), bo Vercel nie uruchomi długo działającego, obciążającego CPU procesu z modelem embeddingów ważącym ok. 100 MB. Zdjęcia wgrywane przez Organizatorów trafiają do magazynu obiektów zgodnego z S3, np. Cloudflare R2 (bez opłat za transfer wychodzący).

Kluczowa zasada: worker komunikuje się z resztą systemu WYŁĄCZNIE przez Postgresa (tabela outbox, embeddingi, Klastry tematyczne). Żadna aplikacja nie wywołuje go bezpośrednio. Dzięki temu można go przenieść na inny host (Cloud Run Jobs, ECS, VPS) albo przepisać (np. w Pythonie), zachowując jedynie kontrakt tabel.

## Considered Options

- **Jeden VPS z Coolify** — odrzucony: najtańszy, ale wymaga więcej pracy operacyjnej (kopie zapasowe, aktualizacje).

## Consequences

- LISTEN/NOTIFY nie działa przez pooler połączeń Neona, więc worker odpytuje outbox cyklicznie (np. co 30–60 s) albo używa połączenia bezpośredniego.
- Częste odpytywanie nie pozwala Neonowi skalować się do zera, więc interwał dobieramy z myślą o koszcie.
- Koszty Vercela i Neona rosną wraz z ruchem.

## Aktualizacja 2026-10-05 (ADR-0008)

`apps/api` stoi na tym samym hoście co worker (Railway albo Fly.io); na Vercelu zostają tylko aplikacje Next.js. Zasada komunikacji workera wyłącznie przez Postgresa się nie zmienia.
