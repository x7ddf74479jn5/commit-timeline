import axios, { AxiosResponse } from "axios";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommitListParam, CommitListResponse, ResponseCommit, Since } from "./api/commit/list";
import dayjs from "dayjs";
import { AiFillGithub, AiOutlineLoading } from "react-icons/ai";
import { CommitCard } from "../components/CommitCard";
import { User } from "./api/auth/check-login";
import { MdOutlineLogout } from "react-icons/md";

export const getStaticProps: GetStaticProps<{ authUrl: string }> = () => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.GITHUB_CLIENT_ID || "");
  params.append("redirect_uri", process.env.GITHUB_REDIRECT_URL || "");
  params.append("scope", ["repo", "read:user", "user:email"].join(" "));
  return {
    props: {
      authUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    },
  };
};

type GroupBy = "date" | "week" | "repository";
const groupBys: GroupBy[] = ["date", "week", "repository"];
const sinces: Since[] = [
  {
    type: "day",
    quantity: 7,
  },
  {
    type: "day",
    quantity: 14,
  },
  {
    type: "month",
    quantity: 1,
  },
  {
    type: "month",
    quantity: 3,
  },
  {
    type: "month",
    quantity: 6,
  },
];

const Index: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ authUrl }) => {
  const [commitList, setCommitList] = useState<ResponseCommit[]>();
  const [groupBy, setGroupBy] = useState<GroupBy>("date");
  const [user, setUser] = useState<User>();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [since, setSince] = useState<Since>({
    type: "day",
    quantity: 14,
  });
  const accountButtonRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const groupByCommits = useMemo(() => {
    if (!commitList) return;
    if (groupBy === "date") {
      const tmpMap = new Map<string, ResponseCommit[]>();
      commitList.forEach((commit) => {
        const date = dayjs(commit.date).format("YYYY.MM.DD");
        if (tmpMap.has(date)) {
          tmpMap.get(date)?.push(commit);
        } else {
          tmpMap.set(date, [commit]);
        }
      });
      return tmpMap;
    }
    if (groupBy === "week") {
      const tmpMap = new Map<string, ResponseCommit[]>();
      commitList.forEach((commit) => {
        const week = dayjs(commit.date).startOf("week").format("YYYY.MM.DD");
        if (tmpMap.has(week)) {
          tmpMap.get(week)?.push(commit);
        } else {
          tmpMap.set(week, [commit]);
        }
      });
      return tmpMap;
    }
    if (groupBy === "repository") {
      const tmpMap = new Map<string, ResponseCommit[]>();
      commitList.forEach((commit) => {
        const repository = `${commit.repository.owner.login}/${commit.repository.name}`;
        if (tmpMap.has(repository)) {
          tmpMap.get(repository)?.push(commit);
        } else {
          tmpMap.set(repository, [commit]);
        }
      });
      return tmpMap;
    }
  }, [commitList, groupBy]);

  const checkLogin = useCallback(async () => {
    const userResponse = await axios.get<User>("/api/auth/check-login");
    setUser(userResponse.data);
  }, []);

  const fetchCommitListData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post<CommitListResponse, AxiosResponse<CommitListResponse>, CommitListParam>(
        "/api/commit/list",
        {
          since,
        }
      );
      setCommitList(response.data.commits);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [since]);

  useEffect(() => {
    checkLogin();
  }, [checkLogin]);

  useEffect(() => {
    if (user) {
      fetchCommitListData();
    }
  }, [fetchCommitListData, user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountButtonRef.current) {
        const { top, bottom, right, left } = accountButtonRef.current.getBoundingClientRect();
        if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
          return;
        }
      }
      if (accountMenuRef.current) {
        const { top, bottom, right, left } = accountMenuRef.current.getBoundingClientRect();
        if (e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom) {
          setAccountMenuOpen(false);
        }
      }
    };
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div>
      <Head>
        <title>{`commit-timeline`}</title>
        <meta property="og:title" content={`commit-timeline`} />
      </Head>
      <div className="bg-black min-h-screen">
        <div className="bg-sky-900/20 h-full">
          <header className="fixed w-full h-16 backdrop-blur px-4">
            <div className="max-w-5xl mx-auto flex  h-full">
              <div className="text-4xl font-bold tracking-[-0.07em] h-auto my-auto">commit-timeline</div>
              <div className="flex-grow" />
              {user && (
                <div
                  className="flex cursor-pointer"
                  onClick={() => {
                    setAccountMenuOpen(!accountMenuOpen);
                  }}
                  ref={accountButtonRef}
                >
                  <img src={user.avatarUrl} className="rounded-full h-8 my-auto" />
                </div>
              )}
              {user && (
                <div
                  className={`absolute bg-black top-16 transition duration-200 w-64 z-50`}
                  style={{
                    opacity: accountMenuOpen ? 1 : 0,
                    pointerEvents: accountMenuOpen ? undefined : "none",
                    left:
                      (accountButtonRef.current?.getBoundingClientRect().right || 0) -
                      (accountMenuRef.current?.clientWidth || 0),
                  }}
                  ref={accountMenuRef}
                >
                  <div className="bg-sky-900/40">
                    <div className="p-4">
                      <div className="text-base truncate">{user.name}</div>
                    </div>
                    <div className="border-t-[1px] border-gray-700/50 p-3">
                      <button
                        className="text-base transition duration-300 flex w-full"
                        onClick={() => {
                          (async () => {
                            try {
                              await axios.post("/api/auth/logout");
                            } catch (e) {
                              console.log(e);
                            } finally {
                              setUser(undefined);
                            }
                          })();
                        }}
                      >
                        <MdOutlineLogout className="my-auto mr-1 text-gray-400 text-lg" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          <div className="px-4 pt-16 max-w-5xl mx-auto" style={{ minHeight: "calc(100vh - 48px)" }}>
            <div className="mt-2 mx-auto">
              <div className="grid grid-cols-8">
                <div className="col-span-2">
                  <div className="p-4 sticky top-16">
                    <div>
                      <div className="text-lg mb-4 h-8">SINCE</div>
                      <div className="text-lg">
                        <select
                          className="py-2 px-4 font-bold bg-sky-700/20 outline-none border-none focus:outline-none"
                          value={JSON.stringify(since)}
                          onChange={(e) => {
                            setSince(JSON.parse(e.target.value));
                          }}
                        >
                          {sinces.map((optionSince) => (
                            <option value={JSON.stringify(optionSince)} key={JSON.stringify(optionSince)}>
                              {`${optionSince.quantity} ${optionSince.type}${optionSince.quantity > 1 ? "s" : ""}`}
                            </option>
                          ))}
                        </select>
                        <span className="ml-3">ago</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="text-lg mb-4 h-8">GROUP BY</div>
                      <div>
                        {groupBys.map((targetGroupBy) => (
                          <div
                            className={`text-lg p-3 cursor-pointer hover:bg-sky-700/20 duration-200 ${
                              groupBy === targetGroupBy ? "font-bold bg-sky-700/20" : ""
                            }`}
                            onClick={() => {
                              setGroupBy(targetGroupBy);
                            }}
                            key={targetGroupBy}
                          >
                            {targetGroupBy}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-6">
                  {user ? (
                    <div>
                      {loading ? (
                        <div className="flex text-center h-80 pt-40">
                          <AiOutlineLoading className="animate-spin mx-auto text-4xl text-gray-500" />
                        </div>
                      ) : (
                        <div>
                          {groupByCommits &&
                            Array.from(groupByCommits.keys()).map((key) => (
                              <div className="p-4 tracking-tighter" key={key}>
                                <div className="font-bold text-2xl mb-4 h-8">{key}</div>
                                {groupByCommits.get(key)?.map((commit) => (
                                  <CommitCard commit={commit} key={commit.sha} />
                                ))}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex p-4">
                      <button
                        className="h-16 px-8 py-4 w-auto mt-12 mx-auto text-lg flex bg-sky-700/20"
                        onClick={() => {
                          window.location.href = authUrl;
                        }}
                      >
                        <AiFillGithub className="text-3xl h-auto my-auto" />
                        <div className="ml-2 h-auto my-auto">Sign in with GitHub</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <footer className="h-12 text-sm text-gray-300 text-center">Pandashark. All rights Reserved</footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
