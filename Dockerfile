FROM node:24-alpine
WORKDIR /app
COPY package.json engine.mjs server.mjs persistence.mjs telemetry.mjs challenges.mjs ./
COPY dist ./dist
ENV HOST=0.0.0.0
EXPOSE 8765
CMD ["node", "server.mjs"]
