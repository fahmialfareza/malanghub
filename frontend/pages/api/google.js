import cookie from "cookie";

export default async (req, res) => {
  if (req.method === "POST") {
    const url = `${process.env.API_ADDRESS}/api/users/google`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ message: errorData.message });
      }

      const responseData = await response.json();

      // Set cookie with the token
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", responseData.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "strict",
          path: "/",
        })
      );

      res.status(response.status).json(responseData);
    } catch (e) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};
