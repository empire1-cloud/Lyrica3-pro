# ============================================================
# Cultura Vibe Forge — Frontend (React on Cloud Run)
# Multi-stage: build the CRA bundle, serve via lean nginx.
# ============================================================

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
# ajv fix for webpack 5 schema validation; legacy-peer-deps for craco+react-scripts compat
RUN npm install --legacy-peer-deps && \
    npm install ajv ajv-keywords --legacy-peer-deps

COPY . ./

ENV GENERATE_SOURCEMAP=false \
    INLINE_RUNTIME_CHUNK=false \
    DISABLE_ESLINT_PLUGIN=true \
    CI=false \
    ESLINT_NO_DEV_ERRORS=true \
    NODE_OPTIONS=--openssl-legacy-provider

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# ------------------------------------------------------------
FROM nginx:1.27-alpine AS serve
RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
