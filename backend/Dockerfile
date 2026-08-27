FROM node:22-bookworm-slim

RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-pip \
        ffmpeg \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip3 install --no-cache-dir --break-system-packages \
    pdfplumber \
    ffmpeg-python

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
