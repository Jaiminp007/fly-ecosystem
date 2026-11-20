FROM node:24-alpine
WORKDIR /app
COPY package.json engine.mjs server.mjs persistence.mjs telemetry.mjs challenges.mjs ./
COPY dist ./dist
COPY learning/trace-actor.mjs learning/episodic-actor.mjs learning/episodic.mjs learning/joint-episodic.mjs ./learning/
COPY microverse/sim.mjs microverse/strains.mjs microverse/config.mjs ./microverse/
ENV HOST=0.0.0.0
EXPOSE 8765
CMD ["node", "server.mjs"]
