FROM node:18.7.0 as build

# Create app directory
WORKDIR /campaign-worker

COPY package*.json ./
COPY .npmrc .

RUN npm install --force

COPY . .

RUN npm run build

FROM node:18.7.0-alpine

# Set timezone
RUN apk update && \
	apk add --no-cache tzdata && \
	cp /usr/share/zoneinfo/Brazil/East /etc/localtime && \
	echo "Brazil/East" > /etc/timezone && \
	apk del tzdata

# Copy file from build stage
COPY --from=build /campaign-worker/dist/ /app/dist/
COPY --from=build /campaign-worker/node_modules/ /app/node_modules/

WORKDIR /app/dist

EXPOSE 8081

CMD [ "node", "main" ]
