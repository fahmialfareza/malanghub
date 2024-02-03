import cookie from "cookie";
import axios from "axios";

export default async (req, res) => {
  if (req.method === "POST") {
    const config = {
      method: "post",
      url: `${process.env.API_ADDRESS}/api/users/google`,
      data: req.body,
    };

    try {
      const response = await axios(config);

      // @todo - Set cookie
      res.setHeader(
        "Set-cookie",
        cookie.serialize("token", response.data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "strict",
          path: "/",
        })
      );

      res.status(response.status).json(response.data);
    } catch (e) {
      res
        .status(e.response.status)
        .json({ message: e?.response?.data?.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};
