import "server-only";
import { serverEnv } from "@/lib/env";

type ZoomToken = {
  value: string;
  expiresAt: number;
};

type ZoomMeetingResponse = {
  id: number;
  join_url: string;
  start_url: string;
  start_time: string;
  duration: number;
};

let cachedToken: ZoomToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const env = serverEnv();
  const basic = Buffer.from(
    `${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
      env.ZOOM_ACCOUNT_ID,
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`ZOOM_AUTH_FAILED: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
}

export async function createZoomMeeting(input: {
  topic: string;
  startTime: Date;
  durationMinutes: number;
  agenda?: string;
}): Promise<ZoomMeetingResponse> {
  const token = await getAccessToken();

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic.slice(0, 200),
      type: 2,
      start_time: input.startTime.toISOString(),
      duration: Math.min(input.durationMinutes, 40),
      timezone: "UTC",
      agenda: input.agenda?.slice(0, 2000),
      settings: {
        join_before_host: true,
        waiting_room: false,
        approval_type: 2,
        audio: "both",
        auto_recording: "none",
        meeting_authentication: false,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `ZOOM_CREATE_FAILED: ${response.status} ${detail.slice(0, 300)}`,
    );
  }

  return (await response.json()) as ZoomMeetingResponse;
}
