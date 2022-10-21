import { ResponseCommit } from "../pages/api/commit/list";

export const mockData: ResponseCommit[] = [
  {
    sha: "8151325dcdbae9e0ff95f9f9658432dbedfdb209",
    url: "https://github.com/sample/sample/commit/8151325dcdbae9e0ff95f9f9658432dbedfdb209",
    message: "sample commit",
    date: "2022-01-03T00:00:00Z",
    changedFiles: 10,
    additions: 100,
    deletions: 100,
    repository: {
      name: "sample",
      url: "https://github.com/sample/sample",
      owner: {
        login: "sample",
      },
    },
    branches: [
      {
        name: "master",
      },
    ],
  },
  {
    sha: "1ff0b5b1c089d0f9e040a9080110e0be12d42867",
    url: "https://github.com/sample/sample/commit/1ff0b5b1c089d0f9e040a9080110e0be12d42867",
    message: "sample commit",
    date: "2022-01-03T00:00:00Z",
    changedFiles: 10,
    additions: 100,
    deletions: 100,
    repository: {
      name: "sample",
      url: "https://github.com/sample/sample",
      owner: {
        login: "sample",
      },
    },
    branches: [
      {
        name: "master",
      },
    ],
  },
  {
    sha: "4e62e3ce2345b54c54af1490a7f3ca6e0254e082",
    url: "https://github.com/sample/sample/commit/4e62e3ce2345b54c54af1490a7f3ca6e0254e082",
    message: "sample commit",
    date: "2022-01-02T00:00:00Z",
    changedFiles: 10,
    additions: 100,
    deletions: 100,
    repository: {
      name: "sample",
      url: "https://github.com/sample/sample",
      owner: {
        login: "sample",
      },
    },
    branches: [
      {
        name: "master",
      },
    ],
  },
  {
    sha: "96c567e0473ae888602f6745da6a5953df25d673",
    url: "https://github.com/sample/sample/commit/96c567e0473ae888602f6745da6a5953df25d673",
    message: "sample commit",
    date: "2022-01-02T00:00:00Z",
    changedFiles: 10,
    additions: 100,
    deletions: 100,
    repository: {
      name: "sample",
      url: "https://github.com/sample/sample",
      owner: {
        login: "sample",
      },
    },
    branches: [
      {
        name: "master",
      },
    ],
  },
];
