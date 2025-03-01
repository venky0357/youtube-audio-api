const express = require("express");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const cookiesPath = path.join(__dirname, "cookies.txt");

// Function to check if cookies are valid
const isCookiesValid = async () => {
    try {
        const output = await youtubedl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
            format: "bestaudio",
            getUrl: true,
            cookies: cookiesPath,
        });
        return true; // Cookies are valid
    } catch (error) {
        return false; // Cookies are expired
    }
};

// Function to refresh YouTube cookies using Puppeteer
const refreshCookies = async () => {
    console.log("Refreshing cookies...");
    const browser = await puppeteer.launch({
        headless: true, // Must be true for server environments
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
        ],
        executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", // Use system Chrome
    });
    const page = await browser.newPage();
    
    // Navigate to YouTube login page
    await page.goto("https://accounts.google.com/signin/v2/identifier?service=youtube");

    // Wait for the user to log in manually
    console.log("Please log in manually in the opened browser window...");
    await page.waitForTimeout(30000); // 30 seconds to log in

    // Extract cookies
    const cookies = await page.cookies();
    const cookieString = cookies.map(cookie => `${cookie.domain}\tTRUE\t/\t${cookie.secure}\t${cookie.expires}\t${cookie.name}\t${cookie.value}`).join("\n");

    // Save cookies to file
    fs.writeFileSync(cookiesPath, cookieString);
    console.log("Cookies refreshed successfully!");

    await browser.close();
};

// Route to get audio URL
app.get("/get-audio", async (req, res) => {
    const videoId = req.query.video_id;
    if (!videoId) {
        return res.status(400).json({ error: "Missing video_id parameter" });
    }

    // Check if cookies are valid, if not, refresh them
    const valid = await isCookiesValid();
    if (!valid) await refreshCookies();

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const output = await youtubedl(videoUrl, {
            format: "bestaudio",
            getUrl: true,
            cookies: cookiesPath, // Use fresh cookies
        });
        res.json({ audio_url: output });
    } catch (error) {
        res.status(500).json({ error: "Failed to get audio URL", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
