# ============================================================
# Lyrica 3 Pro · Empire 1 — Frontend (React PWA on Cloud Run)
# Multi-stage: build the CRA bundle, serve via lean nginx.
# ============================================================

FROM node:20-alpine AS build
WORKDIR /app

# dep manifest first → docker cache on yarn.lock hits
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . ./

# production flags — no sourcemaps, no inline runtime
ENV GENERATE_SOURCEMAP=false \
    INLINE_RUNTIME_CHUNK=false \
    DISABLE_ESLINT_PLUGIN=true

# REACT_APP_BACKEND_URL is baked at build time.
# Pass via `--build-arg REACT_APP_BACKEND_URL=https://api.lyrica3.com`
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# ------------------------------------------------------------
FROM nginx:1.27-alpine AS serve
RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

# Cloud Run injects $PORT — substitute into the nginx template at runtime
ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
