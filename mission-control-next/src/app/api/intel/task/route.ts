import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intelId, intelTitle, comment } = body;
    
    // The required string format for events.txt trigger is arbitrary, but it must be appended.
    const eventLine = `NEW_TASK: Intel ID ${intelId} | Title: ${intelTitle} | Comment: ${comment}\n`;
    const workspaceRoot = process.env.WORKSPACE_ROOT ?? '/data/workspace';
    const filePath = `${workspaceRoot}/inbox/events.txt`;
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.appendFileSync(filePath, eventLine);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to append event:', error);
    return NextResponse.json({ error: 'Failed to trigger task' }, { status: 500 });
  }
}