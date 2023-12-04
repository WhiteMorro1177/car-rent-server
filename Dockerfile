FROM node:lts-slim

WORKDIR /app
COPY . /app
RUN npm install express pg

CMD [ "node", "index.js" ]