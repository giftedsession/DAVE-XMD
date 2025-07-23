# Use official Node.js LTS image
FROM node:lts-buster

# Install git
RUN apt-get update && apt-get install -y git

# Clone your GitHub repository
RUN git clone https://github.com/giftedsession/DAVE-XMD /root/DAVE-XMD

# Set working directory to the cloned repo
WORKDIR /root/DAVE-XMD

# Install project dependencies and pm2 globally
RUN npm install --network-concurrency 1 && npm install -g pm2

# Expose port (if using express or similar)
EXPOSE 9090

# Start the bot using npm (PM2 is optional unless specified in npm scripts)
CMD ["npm", "start"]
