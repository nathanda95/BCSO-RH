FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
