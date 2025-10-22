# DulceMarket – Dockerizado (fix)

## Levantar
```bash
docker compose up -d --build
```

- Frontend: http://localhost
- Backend:  http://localhost:8080
- DB:       localhost:5432 (postgres/postgres)

> Nota: Se usa `npm install` en el Dockerfile del frontend para evitar el error de `npm ci` cuando no existe `package-lock.json`.

## Desarrollo local
- `frontend/vite.config.js` proxyea `/api` → `http://localhost:8080`
- `.env` opcional: `VITE_API_URL=/api`
# marketplace-
# marketplace-prueba
