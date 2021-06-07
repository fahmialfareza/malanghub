import cookie from "cookie";
import axios from "axios";

export default async (req, res) => {
  if (req.method === "GET") {
    if (!req.headers.cookie) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }

    const { token } = cookie.parse(req.headers.cookie);

    const config = {
      method: "get",
      url: `${process.env.NEXT_PUBLIC_API_ADDRESS}/api/users`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await axios(config);

      res.status(response.status).json(response.data);
    } catch (e) {
      res.status(e.response.status).json({ message: e.response.data.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};
