FROM node:24-alpine
WORKDIR /app

RUN apk update && apk add --no-cache \
    g++ \
    gcc \
    openjdk17 \
    python3

COPY package*.json ./
RUN npm i

COPY . .

EXPOSE 5000
CMD ["npm", "start"]