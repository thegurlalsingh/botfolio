FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y \
        curl \
        make \
        g++ \
        ffmpeg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir \
    pdfplumber \
    ffmpeg-python

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

# Keys directory
RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
