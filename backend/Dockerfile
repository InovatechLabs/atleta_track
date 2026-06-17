FROM node:20-bullseye AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
RUN mkdir -p uploads
EXPOSE 3333
CMD ["npm", "run", "start"]
