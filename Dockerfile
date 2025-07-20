FROM node:lts-buster

# Clone the repository into /root/𝐃𝐀𝐕𝐄-𝐗𝐌𝐃
RUN git clone https://github.com/giftedsession/DAVE-XMD /root/𝐃𝐀𝐕𝐄-𝐗𝐌𝐃

# Set the working directory to the cloned repo
WORKDIR /root/𝐃𝐀𝐕𝐄-𝐗𝐌𝐃

# Install dependencies
RUN npm install && npm install -g pm2

# Copy local files if needed (optional, can be omitted if building from repo only)
# COPY . .

EXPOSE 9090

CMD ["npm", "start"]
