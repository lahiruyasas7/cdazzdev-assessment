FROM node:20-alpine

WORKDIR /app

# Copy manifests first so `npm install` is cached by Docker as long as
# dependencies haven't changed, even if application code has.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
