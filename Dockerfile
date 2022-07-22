FROM node:alpine

COPY . .

WORKDIR /

EXPOSE 5432

RUN [ "npm", "ci" ]

RUN [ "npm", "run", "build" ]

CMD npm run start