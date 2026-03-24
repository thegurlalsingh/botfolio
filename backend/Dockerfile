FROM python:3.11-slim

# Install system dependencies + Node.js 18
RUN apt-get update && \
    apt-get install -y curl make g++ python3 && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install python dependency
RUN pip install pdfplumber --break-system-packages

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN RUN npm install --omit=dev

# Copy source code
COPY . .

RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["npm", "start"]
