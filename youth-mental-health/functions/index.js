import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import sgMail from "@sendgrid/mail";
import corsPkg from "cors";

const cors = corsPkg({ origin: true }); // you can restrict later
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_FROM = defineSecret("SENDGRID_FROM");

if (!getApps().length) initializeApp();

// Automatically sends to the logged-in user's email if authenticated; falls back to provided "to"
export const sendEmail = onRequest(
  {
    region: "australia-southeast1",
    secrets: [SENDGRID_API_KEY, SENDGRID_FROM],
    cors: true
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method Not Allowed" });
      }
      try {
        const { to, subject, html, text, cc, bcc, replyTo, fromName } = req.body || {};
        if (!to || !subject || (!html && !text)) {
          return res.status(400).json({ ok: false, error: "Missing fields" });
        }

        sgMail.setApiKey(SENDGRID_API_KEY.value());
        const msg = {
          to: req.auth?.token?.email || to,
          from: { email: SENDGRID_FROM.value(), name: fromName || "Youth Health" },
          replyTo,
          subject,
          html,
          text,
          cc,
          bcc
        };

        const MAX = 20000;
        if ((html && html.length > MAX) || (text && text.length > MAX)) {
          return res.status(413).json({ ok: false, error: "Payload too large" });
        }

        const [resp] = await sgMail.send(msg);
        return res
          .status(200)
          .json({ ok: true, messageId: resp?.headers?.["x-message-id"] || null });
      } catch (err) {
        console.error("sendEmail error:", err?.response?.body || err);
        const reason =
          err?.response?.body?.errors?.map(e => e.message).join("; ") ||
          err?.message ||
          "Unknown error";
        return res.status(500).json({ ok: false, error: reason });
      }
    });
  }
);
