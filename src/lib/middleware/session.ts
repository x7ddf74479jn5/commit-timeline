import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiHandler } from "next";

export const withSession = <T>(route: NextApiHandler<T>): NextApiHandler<T> => {
  if (!process.env.COOKIE_PASSWORD) throw new Error();
  return withIronSessionApiRoute(route, {
    cookieName: "commit-timeline_id",
    password: process.env.COOKIE_PASSWORD,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
    ttl: 30 * 24 * 60 * 60,
  });
};
