import { serialize, parse } from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    if (!req.headers.cookie) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const { token } = parse(req.headers.cookie);

    const url = `${process.env.API_ADDRESS}/api/users`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ message: errorData.message });
      }

      const responseData = await response.json();
      res.status(response.status).json(responseData);
    } catch (e) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    // Destroy cookie
    res.setHeader(
      "Set-Cookie",
      serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        sameSite: "strict",
        path: "/",
      })
    );
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};
