# Backend (Node + Express + Prisma)

## Comandos útiles
```bash
cd server
cp .env.example .env
npm i
npm run prisma:generate
npm run prisma:migrate     # crea dev.db con el esquema
npm run dev                # inicia en http://localhost:4000
```

## Cambiar a Postgres
1. Instala Postgres y crea una DB.
2. En `.env` reemplaza `DATABASE_URL` por algo como:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/labdb?schema=public"
```
3. En `prisma/schema.prisma` cambia `provider = "sqlite"` por `"postgresql"`.
4. Ejecuta:
```bash
npm run prisma:generate
npm run prisma:migrate
```
