/** Dev 环境 mock 登录 / mock 作品判定，避免依赖旧业务后端 */

export const MOCK_DEV_TOKEN = "mock-dev-token";

export function isDevMockAuth(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem("token") === MOCK_DEV_TOKEN;
  } catch {
    return false;
  }
}

export function isMockWorkId(workId: unknown): boolean {
  return typeof workId === "string" && workId.startsWith("mock-work-");
}

export function shouldUseDevMockApis(workId?: unknown): boolean {
  return isDevMockAuth() || isMockWorkId(workId);
}

const DEFAULT_MOCK_SERVER_DATA = {
  "大纲.md": "# 大纲\n\n在此开始创作。\n",
  "知识库/": "",
  "设定/角色设定.md": "# 角色设定\n",
  "设定/故事设定.md": "# 故事设定\n",
  "正文/第一章.md": "# 第一章\n",
};

export function createMockWorkDetail(workId: string) {
  const now = new Date().toISOString();
  return {
    id: workId,
    workId,
    title: "本地 Mock 作品",
    introduction: "开发环境本地 mock，无需旧后端接口。",
    description: "",
    stage: "final",
    chapterNum: 10,
    wordNum: 1000,
    createdTime: now,
    updatedTime: now,
    workTags: [],
    sessions: [],
    inspirationDraws: [],
    latestWorkVersion: {
      content: JSON.stringify(DEFAULT_MOCK_SERVER_DATA),
    },
  };
}

export function createEmptyNotificationPage(page = 0, size = 20) {
  return {
    totalPages: 0,
    totalElements: 0,
    size,
    content: [] as unknown[],
    number: page,
    sort: { empty: true, sorted: false, unsorted: true },
    pageable: {
      offset: page * size,
      sort: { empty: true, sorted: false, unsorted: true },
      unpaged: false,
      paged: true,
      pageNumber: page,
      pageSize: size,
    },
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  };
}
