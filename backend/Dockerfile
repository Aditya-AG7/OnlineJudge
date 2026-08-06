FROM node:24-alpine
WORKDIR /app
RUN apk update && apk add --no-cache g++
COPY . .
EXPOSE 5000
RUN npm i
CMD ["npm", "start"]