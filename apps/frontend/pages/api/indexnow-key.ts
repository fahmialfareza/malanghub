import { NextApiRequest, NextApiResponse } from "next";

// Serves the IndexNow key verification file at /{key}.txt
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    res.status(404).send("Not found");
    return;
  }
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).send(key);
}
