FROM node:lts-slim

WORKDIR /app
COPY . /app
RUN npm i

CMD [ "node", "index.js" ]