import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? '/data/workspace';
const TEMPLATES_DIR = `${WORKSPACE_ROOT}/outreach/templates`;

export async function GET() {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR).sort();
    const templates = files.map((file) => {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf-8");
      const subjectMatch = content.match(/^subject:\s*(.+)$/m);
      const subject = subjectMatch ? subjectMatch[1].trim() : "(no subject)";
      const body = content.replace(/^subject:.*$/m, "").replace(/^---\n?/, "").trim();
      const id = file.replace(".txt", "");
      return { id, subject, body };
    });
    return NextResponse.json(templates);
  } catch (err) {
    return NextResponse.json({ error: "Failed to read templates" }, { status: 500 });
  }
}
