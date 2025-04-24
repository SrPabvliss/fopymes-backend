# Etapa de construcción
FROM oven/bun:1.1 as builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lockb ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Etapa de producción
FROM oven/bun:1.1-slim as production

WORKDIR /app

# Crear un usuario no-root para ejecutar la aplicación
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 bunjs \
    && chown -R bunjs:nodejs /app

# Copiar dependencias y archivos compilados desde la etapa de construcción
COPY --from=builder --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=bunjs:nodejs /app/bun.lockb ./bun.lockb
COPY --from=builder --chown=bunjs:nodejs /app/src ./src
COPY --from=builder --chown=bunjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=bunjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=bunjs:nodejs /app/tsconfig.json ./tsconfig.json

# Exponer el puerto de la aplicación
EXPOSE 3005

# Cambiar al usuario no-root
USER bunjs

# Comando para ejecutar la aplicación
CMD ["bun", "run", "dev"]
