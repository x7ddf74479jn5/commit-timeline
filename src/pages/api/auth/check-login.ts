import { IronSessionData } from "iron-session";
import { withSession } from "../../../lib/middleware/session";
import type { NextApiRequest, NextApiResponse } from "next";

export type User = {
  avatarUrl: string;
  name: string;
  url: string;
  email: string;
};

const authCheckLoginRoute = async (req: NextApiRequest, res: NextApiResponse<{}>) => {
  const { user } = req.session as IronSessionData;
  if (!user) {
    res.status(401).end();
    return;
  }
  const { avatarUrl, name, url, email } = user;
  res.status(200).json({
    avatarUrl,
    name,
    url,
    email,
  });
};

export default withSession(authCheckLoginRoute);
