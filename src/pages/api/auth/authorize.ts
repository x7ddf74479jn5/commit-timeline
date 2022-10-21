import type { NextApiRequest, NextApiResponse } from "next";
import axios, { AxiosResponse } from "axios";
import { withSession } from "../../../lib/middleware/session";
import { IronSessionData } from "iron-session";

const authAuthorizeRoute = async (req: NextApiRequest, res: NextApiResponse<{}>) => {
  try {
    const { code } = req.query as { code?: string };
    if (!code) throw new Error();
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", process.env.GITHUB_CLIENT_ID || "");
    params.append("client_secret", process.env.GITHUB_CLIENT_SECRET || "");
    const tokenResponse = await axios.post<
      {},
      AxiosResponse<{ access_token: string; scope: string; token_type: string }>
    >(`https://github.com/login/oauth/access_token`, params, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const { access_token: accessToken } = tokenResponse.data;
    const userResponse = await axios.get<{ avatar_url: string; login: string; html_url: string }>(
      "https://api.github.com/user",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${accessToken}`,
        },
      }
    );

    const { avatar_url: avatarUrl, login, html_url } = userResponse.data;
    const emailResponse = await axios.get<[{ email: string; primary: boolean }]>("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `token ${accessToken}`,
      },
    });

    (req.session as IronSessionData).user = {
      accessToken,
      avatarUrl,
      name: login,
      url: html_url,
      email: emailResponse.data.find(({ primary }) => primary)?.email,
    };

    await req.session.save();
  } catch (error) {
    console.log(error);
  }
  res.redirect("/").end();
};
export default withSession(authAuthorizeRoute);
