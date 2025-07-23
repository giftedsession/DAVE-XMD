const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "githubstalk",
    desc: "Fetch detailed GitHub user profile including profile picture.",
    category: "menu",
    react: "🖥️",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const username = args[0];
        if (!username) return reply("Please provide a GitHub username.");

        const apiUrl = `https://api.github.com/users/${username}`;
        const { data } = await axios.get(apiUrl);

        let userInfo = `👤 *Username*: ${data.name || data.login}
🔗 *GitHub URL*: ${data.html_url}
📝 *Bio*: ${data.bio || 'Not available'}
📍 *Location*: ${data.location || 'Unknown'}
📊 *Public Repos*: ${data.public_repos}
👥 *Followers*: ${data.followers} | Following: ${data.following}
📅 *Created At*: ${new Date(data.created_at).toDateString()}
🔭 *Public Gists*: ${data.public_gists}

_© Powered by 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃_`;

        await conn.sendMessage(from, {
            image: { url: data.avatar_url },
            caption: userInfo
        }, { quoted: mek });

    } catch (e) {
        console.log("GitHubStalk Error:", e);
        reply(`❌ Error: ${e.response?.data?.message || e.message}`);
    }
});
