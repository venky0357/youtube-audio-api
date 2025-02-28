const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());

app.get("/get-audio", (req, res) => {
    const videoId = req.query.video_id;
    if (!videoId) {
        return res.status(400).json({ error: "Missing video_id parameter" });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    exec(`yt-dlp -f bestaudio --get-url ${videoUrl}`, (error, stdout) => {
        if (error) {
            return res.status(500).json({ error: "Failed to get audio URL" });
        }
        res.json({ audio_url: stdout.trim() });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
