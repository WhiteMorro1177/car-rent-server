FROM node:lts-slim

WORKDIR /app
COPY . /app
RUN npm install express
RUN npm install pg

CMD [ "node", "index.js" ]