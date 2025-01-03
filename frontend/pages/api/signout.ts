import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // Destroy cookie
    res.setHeader(
      "Set-cookie",
      cookie.serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        sameSite: "strict",
        path: "/",
      })
    );

    res.status(200).json({ message: "Success" });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};
