# Use official Node.js LTS image
FROM node:lts-buster

# Clone your GitHub repository
RUN git clone https://github.com/giftedsession/DAVE-XMD /root/DAVE-XMD

# Set working directory
WORKDIR /root/DAVE-XMD

# Install dependencies
RUN npm install && npm install -g pm2 || yarn install --network-concurrency 1

# Copy any remaining local files (optional)
COPY . .

# Expose your bot port (if needed)
EXPOSE 9090

# Start the bot
CMD ["npm", "start"]
