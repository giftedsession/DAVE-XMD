const fetch = require('node-fetch');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "repo",
    alias: ["sc", "script", "info"],
    desc: "Fetch GitHub repository information with random images and quotes.",
    react: "📂",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/giftedsession/DAVE-XMD';

    const randomImageUrls = [
        "https://files.catbox.moe/nxzaly.jpg",
        "https://files.catbox.moe/0w7hqx.jpg",
        "https://files.catbox.moe/95n1x6.jpg",
        "https://files.catbox.moe/og4tsk.jpg",
        "https://files.catbox.moe/q8af5p.jpg"
    ];

    const quotes = [
        "✨ The best way to predict the future is to create it. - Peter Drucker",
        "🌐 Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "🍁 The only way to do great work is to love what you do. - Steve Jobs",
        "📶 Innovation distinguishes between a leader and a follower. - Steve Jobs",
        "🎵 Life is what happens when you're busy making other plans. - John Lennon"
    ];

    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

    try {
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repoData = await response.json();

        const selectedImage = getRandomElement(randomImageUrls);
        const selectedQuote = getRandomElement(quotes);
        const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const caption = `╭───『 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 REPO 』───⳹
│
│ 📦 *Repository*: ${repoData.name}
│ 👑 *Owner*: ${repoData.owner.login}
│ ⭐ *Stars*: ${repoData.stargazers_count}
│ ⑂ *Forks*: ${repoData.forks_count}
│ 🔗 *URL*: ${repoData.html_url}
│
│ 📝 *Description*:
│ ${repoData.description || 'No description'}
│
│ 💬 _"${selectedQuote}"_
╰────────────────⳹
> ${config.DESCRIPTION || 'Created with ❤️ by 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 Devs'}`;

        await conn.sendMessage(from, {
            image: { url: selectedImage },
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400480173280@newsletter',
                    newsletterName: '𝐃𝐀𝐕𝐄-𝐗𝐌𝐃',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, {
            audio: { url: 'https://files.catbox.moe/ddmjyy.mp3' },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("Repo command error:", err);
        reply(`❌ Error: ${err.message}`);
    }
});
