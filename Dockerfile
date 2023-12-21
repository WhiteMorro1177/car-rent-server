FROM node:lts-slim

WORKDIR /app
COPY . /app
RUN npm install pg
RUN npm install express

CMD [ "node", "index.js" ]