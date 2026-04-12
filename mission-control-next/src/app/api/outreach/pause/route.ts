import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? '/data/workspace';
const PAUSE_FILE = `${WORKSPACE_ROOT}/.outreach_paused`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "status") {
    const paused = fs.existsSync(PAUSE_FILE);
    return NextResponse.json({ paused });
  }

  // Toggle
  const exists = fs.existsSync(PAUSE_FILE);
  if (exists) {
    fs.unlinkSync(PAUSE_FILE);
    return NextResponse.json({ paused: false, message: "Outreach resumed." });
  } else {
    fs.writeFileSync(PAUSE_FILE, new Date().toISOString());
    return NextResponse.json({ paused: true, message: "Outreach paused." });
  }
}
