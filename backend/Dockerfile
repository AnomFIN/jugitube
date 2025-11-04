# Example Dockerfile: base image with ffmpeg and yt-dlp
FROM node:18-bullseye

RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip && rm -rf /var/lib/apt/lists/*

RUN pip3 install yt-dlp

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]