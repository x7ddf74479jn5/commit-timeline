declare module "iron-session" {
  interface IronSessionData {
    user?: {
      accessToken: string;
      avatarUrl: string;
      url: string;
      name: string;
      email?: string;
    };
  }
}
