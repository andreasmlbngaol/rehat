import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    client = new Resend(serverEnv().RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { error } = await getClient().emails.send({
    from: serverEnv().RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Resend gagal mengirim email: ${error.message}`);
  }
}
