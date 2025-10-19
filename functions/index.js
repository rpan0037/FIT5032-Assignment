import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";
import corsPkg from "cors";

const cors = corsPkg({ origin: true });
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_FROM = defineSecret("SENDGRID_FROM");

if (!getApps().length) initializeApp();

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

export const sendBulkEmail = onCall(
  {
    region: "australia-southeast1",
    secrets: [SENDGRID_API_KEY, SENDGRID_FROM]
  },
  async (request) => {

    const subject = String(request.data?.subject || "").trim();
    const text = String(request.data?.text || "").trim();
    const html = String(request.data?.html || "").trim();
    if (!subject || !text) {
      throw new HttpsError("invalid-argument", "Subject and message are required");
    }

    // Init SendGrid
    sgMail.setApiKey(SENDGRID_API_KEY.value());

    // Fetch recipients from Firestore
    const db = getFirestore();
    const snap = await db.collection("user-role").get();
    const emails = snap.docs
      .map((d) => String(d.data()?.email || "").toLowerCase())
      .filter((e) => e && e.includes("@"));

    const unique = Array.from(new Set(emails));
    if (unique.length === 0) {
      return { ok: true, sent: 0 };
    }

    const from = { email: SENDGRID_FROM.value(), name: "Youth Health" };
    const chunkSize = 100;
    let sent = 0;

    for (let i = 0; i < unique.length; i += chunkSize) {
      const chunk = unique.slice(i, i + chunkSize);
      const msgs = chunk.map((to) => ({ to, from, subject, text, html }));
      await sgMail.send(msgs, { batch: true });
      sent += chunk.length;
    }

    return { ok: true, sent };
  }
);

export const getEvents = onRequest(
  {
    region: "australia-southeast1",
    cors: true
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "Method Not Allowed" });
      }
      try {
        const db = getFirestore();
        const limitParam = Math.max(1, Math.min(1000, parseInt(String(req.query.limit || "500"), 10) || 500));
        const modeFilter = String(req.query.mode || "").toLowerCase();

        let ref = db.collection("events");
        const snap = await ref.orderBy("datetime", "desc").get();
        const rows = snap.docs.map(d => {
          const data = d.data() || {};
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
          return {
            id: data.id ?? d.id,
            title: data.title || "",
            description: data.description || "",
            datetime: data.datetime || "",
            mode: data.mode || "",
            location: data.location || "",
            createdAt
          };
        });

        const filtered = modeFilter
          ? rows.filter(r => String(r.mode || "").toLowerCase().includes(modeFilter))
          : rows;
        const out = filtered.slice(0, limitParam);
        return res.status(200).json({ ok: true, count: out.length, events: out });
      } catch (err) {
        console.error("getEvents error:", err);
        return res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
      }
    });
  }
);

export const getHelpRequests = onRequest(
  {
    region: "australia-southeast1",
    cors: true
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "Method Not Allowed" });
      }
      try {
        const db = getFirestore();
        const limitParam = Math.max(1, Math.min(2000, parseInt(String(req.query.limit || "500"), 10) || 500));
        const topicFilter = String(req.query.topic || "").toLowerCase();

        const snap = await db.collection("help-requests").orderBy("createdAt", "desc").get();
        const rows = snap.docs.map(d => {
          const data = d.data() || {};
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
          return {
            id: d.id,
            createdAt,
            topic: data.topic || "",
            status: data.status || "",
            preferredContact: data.preferredContact || data.preferredcontact || "",
            details: data.details || data.message || ""
          };
        });

        const filtered = topicFilter
          ? rows.filter(r => String(r.topic || "").toLowerCase() === topicFilter)
          : rows;
        const out = filtered.slice(0, limitParam);
        return res.status(200).json({ ok: true, count: out.length, helpRequests: out });
      } catch (err) {
        console.error("getHelpRequests error:", err);
        return res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
      }
    });
  }
);
