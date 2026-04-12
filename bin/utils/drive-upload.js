const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_FILE = '/data/.openclaw/workspace/.secrets/google-drive-service-account.json';
const FOLDER_ID = '1-9ir_IX1Jmb6JkqccyUCL8QG0_9WOOU6';
const FILES = [
    '/data/.openclaw/workspace/MEMORY.md',
    '/data/.openclaw/workspace/COST_CONTROL.md',
    '/data/.openclaw/workspace/SOUL.md',
    '/data/.openclaw/workspace/USER.md'
];

async function backup() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    for (const filePath of FILES) {
        if (!fs.existsSync(filePath)) continue;
        const fileName = path.basename(filePath);
        try {
            // Service accounts need to write to shared folders where they have 'Editor' access
            // Using multipart upload as metadata-only workaround if quota is an issue
            await drive.files.create({
                requestBody: { name: fileName, parents: [FOLDER_ID] },
                media: { mimeType: 'text/markdown', body: fs.createReadStream(filePath) },
                supportsAllDrives: true
            });
            console.log(`✅ Uploaded ${fileName}`);
        } catch (err) {
            console.error(`❌ Failed ${fileName}: ${err.message}`);
        }
    }
}
backup();
