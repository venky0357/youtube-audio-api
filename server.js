const express = require("express");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const cookiesPath = path.join(__dirname, "cookies.txt");

// Function to check if cookies are valid
const isCookiesValid = async () => {
    try {
        await youtubedl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
            format: "bestaudio",
            getUrl: true,
            cookies: cookiesPath,
        });
        return true; // Cookies are valid
    } catch (error) {
        console.log("Cookies expired! Refreshing...");
        return false; // Cookies are expired
    }
};

// Function to refresh YouTube cookies using Puppeteer
const refreshCookies = async () => {
    console.log("Refreshing cookies...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
        ],
        executablePath: "/opt/render/.cache/puppeteer/chrome/linux-133.0.6943.126/chrome-linux64/chrome",
    });

    const page = await browser.newPage();

    // Navigate to YouTube login page
    await page.goto("https://accounts.google.com/signin/v2/identifier?service=youtube", { waitUntil: "networkidle2" });

    // Enter email
    await page.type('input[type="email"]', process.env.YT_EMAIL);
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2" }); // Ensure next step loads

    // Enter password
    await page.type('input[type="password"]', process.env.YT_PASSWORD);
await page.keyboard.press("Enter"); 
    await page.waitForNavigation({ waitUntil: "networkidle2" }); // Wait until logged in

    console.log("Logged in successfully!");

    // Extract cookies
    const context = browser.defaultBrowserContext();
    const cookies = await context.cookies();
    const cookieString = cookies.map(cookie =>
        `${cookie.domain}\tTRUE\t/\t${cookie.secure}\t${cookie.expires}\t${cookie.name}\t${cookie.value}`
    ).join("\n");

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

// Start server on Render's assigned port
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
