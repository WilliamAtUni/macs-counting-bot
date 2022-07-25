FROM node:alpine

COPY . .

WORKDIR /

RUN [ "npm", "ci" ]

RUN [ "npm", "run", "build" ]

CMD npm run start