import axios, { AxiosResponse } from "axios";
import { IronSessionData } from "iron-session";
import { NextApiRequest, NextApiResponse } from "next";
import { withSession } from "../../../lib/middleware/session";
import dayjs from "dayjs";
import { mockData } from "../../../lib/mock";

export type Since = {
  type: "day" | "week" | "month" | "year";
  quantity: number;
};

export type CommitListParam = {
  since: Since;
};

type Repository = {
  name: string;
  url: string;
  owner: {
    login: string;
  };
  refs: {
    totalCount: number;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
    nodes: {
      name: string;
      target: {
        history: {
          nodes: {
            message: string;
            url: string;
            committedDate: string;
            oid: string;
            changedFiles: number;
            additions: number;
            deletions: number;
          }[];
        };
      };
    }[];
  };
};

type ContributedRepository = {
  name: string;
  url: string;
  owner: {
    login: string;
  };
};

type RepositoriesContributedTo = {
  data: {
    user: {
      repositoriesContributedTo: {
        totalCount: number;
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        nodes: ContributedRepository[];
      };
    };
  };
};

type Commit = {
  url: string;
  message: string;
  date: string;
  sha: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  repository: {
    name: string;
    url: string;
    owner: {
      login: string;
    };
  };
  branch: {
    name: string;
  };
};

export type ResponseCommit = {
  url: string;
  message: string;
  date: string;
  sha: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  repository: {
    name: string;
    url: string;
    owner: {
      login: string;
    };
  };
  branches: {
    name: string;
  }[];
};

export type CommitListResponse = {
  commits: ResponseCommit[];
};

const formatCommitsFromRepo = (repos: Repository[]) => {
  const commits: Commit[] = [];
  repos.forEach((repository) => {
    repository.refs.nodes.forEach((branch) => {
      const branchname = branch.name;
      branch.target.history.nodes.forEach(
        ({ url, message, committedDate, oid, changedFiles, additions, deletions }) => {
          commits.push({
            sha: oid,
            url,
            message,
            date: committedDate,
            repository,
            changedFiles,
            additions,
            deletions,
            branch: {
              name: branchname,
            },
          });
        }
      );
    });
  });
  return commits;
};

const fetchEachRepositoryCommits = async (
  repository: ContributedRepository,
  accessToken: string,
  email: string,
  since: string
) => {
  const commits: Commit[] = [];
  let hasNext = true;
  let nextCursor: string | undefined;
  while (hasNext) {
    const repositoriesResponse = await axios.post<{}, AxiosResponse<{ data: { repository: Repository } }>>(
      "https://api.github.com/graphql",
      {
        query: `
                        query(
                            $name: String!,
                            $owner: String!,
                            $email: String!,
                            $since: GitTimestamp,
                            $nextCursor: String
                        ) {
                            repository(
                                name: $name, 
                                owner: $owner
                            ) {
                                name
                                url
                                owner {
                                    login
                                }
                                refs(
                                    refPrefix: "refs/heads/", 
                                    first: 100,
                                    after: $nextCursor
                                ) {
                                    totalCount
                                    pageInfo {
                                        endCursor
                                        hasNextPage
                                    }
                                    nodes {
                                        name
                                        target{
                                            ... on Commit {
                                                history(
                                                    first:100,
                                                    author:{
                                                        emails: [$email]
                                                    },
                                                    since: $since
                                                ){
                                                    nodes {
                                                        message
                                                        url
                                                        committedDate
                                                        oid
                                                        changedFiles
                                                        additions
                                                        deletions
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `,
        variables: {
          name: repository.name,
          owner: repository.owner.login,
          email,
          since,
          nextCursor,
        },
      },
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${accessToken}`,
        },
      }
    );
    commits.push(...formatCommitsFromRepo([repositoriesResponse.data.data.repository]));
    hasNext = repositoriesResponse.data.data.repository.refs.pageInfo.hasNextPage;
    nextCursor = repositoriesResponse.data.data.repository.refs.pageInfo.endCursor;
  }
  return commits;
};

export const commitListRoute = async (req: NextApiRequest, res: NextApiResponse<{}>) => {
  const { user } = req.session as IronSessionData;
  if (!user) {
    res.status(401).end();
    return;
  }
  const { accessToken, name: userName, email } = user;
  if (!email) {
    res.status(401).end();
    return;
  }
  if (process.env.USE_MOCK) {
    res.status(200).json({
      commits: mockData,
    });
    return;
  }
  const {
    since: { type, quantity },
  } = req.body as CommitListParam;
  const since = dayjs().clone().add(-quantity, type).format("YYYY-MM-DDTHH:mm:ss");
  const contributedRepositories: ContributedRepository[] = [];
  let hasNext = true;
  let nextCursor: string | undefined;
  while (hasNext) {
    const repositoriesContributedToResponse = await axios.post<{}, AxiosResponse<RepositoriesContributedTo>>(
      "https://api.github.com/graphql",
      {
        query: `
                    query(
                        $userName: String!,
                        $nextCursor: String
                    ) { 
                        user(login: $userName) { 
                            repositoriesContributedTo(
                                includeUserRepositories: true,
                                contributionTypes: COMMIT,
                                first: 10,
                                orderBy: {
                                    direction: DESC,
                                    field: PUSHED_AT
                                },
                                after: $nextCursor
                            ) {
                                totalCount
                                pageInfo {
                                    endCursor
                                    hasNextPage
                                }
                                nodes {
                                    name
                                    url
                                    owner {
                                        login
                                    }
                                }
                            }
                        }
                    }
                `,
        variables: {
          userName,
          nextCursor,
        },
      },
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${accessToken}`,
        },
      }
    );
    contributedRepositories.push(...repositoriesContributedToResponse.data.data.user.repositoriesContributedTo.nodes);
    hasNext = repositoriesContributedToResponse.data.data.user.repositoriesContributedTo.pageInfo.hasNextPage;
    nextCursor = repositoriesContributedToResponse.data.data.user.repositoriesContributedTo.pageInfo.endCursor;
  }

  const commitsList: Commit[][] = await Promise.all(
    contributedRepositories.map((repository) => {
      return fetchEachRepositoryCommits(repository, accessToken, email, since);
    })
  );

  const shaCommitMap = new Map<string, ResponseCommit>();
  commitsList.flat().forEach(({ sha, url, message, branch, date, repository, changedFiles, additions, deletions }) => {
    const mappedCommit = shaCommitMap.get(sha);
    if (mappedCommit) {
      mappedCommit.branches.push({
        ...branch,
      });
    } else {
      shaCommitMap.set(sha, {
        sha,
        url,
        message,
        date,
        changedFiles,
        additions,
        deletions,
        repository,
        branches: [branch],
      });
    }
  });

  res.status(200).json({
    commits: Array.from(shaCommitMap.values()).sort((a, b) => dayjs(b.date).diff(dayjs(a.date))),
  });
};

export default withSession(commitListRoute);
