# Stage 1 — build
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Stage 2 — serve
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove all default configs
RUN rm -rf /etc/nginx/conf.d/*

# Replace main nginx.conf (removes hardcoded /etc/nginx/html root)
RUN printf 'user nginx;\nworker_processes auto;\nerror_log /var/log/nginx/error.log notice;\npid /var/run/nginx.pid;\nevents { worker_connections 1024; }\nhttp {\n    include /etc/nginx/mime.types;\n    default_type application/octet-stream;\n    sendfile on;\n    keepalive_timeout 65;\n    include /etc/nginx/conf.d/*.conf;\n}\n' > /etc/nginx/nginx.conf

# Copy your nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist .

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]