import { IronSessionData } from "iron-session";
import { NextApiRequest, NextApiResponse } from "next";
import { withSession } from "../../../lib/middleware/session";

const AuthLogoutRoute = async (req: NextApiRequest, res: NextApiResponse<{}>) => {
  const { user } = req.session as IronSessionData;
  if (!user) {
    res.status(401).end();
    return;
  }
  req.session.destroy();
  res.status(200).end();
};
export default withSession(AuthLogoutRoute);
