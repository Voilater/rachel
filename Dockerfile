# Build on the host CPU (fast on Mac). Output is JS and runs on amd64.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

WORKDIR /app

RUN npm install -g npm@11

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# Runtime image for EC2 (linux/amd64).
FROM --platform=linux/amd64 node:22-alpine AS run

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN npm install -g npm@11

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
