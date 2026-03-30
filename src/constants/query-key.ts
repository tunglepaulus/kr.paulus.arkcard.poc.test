const ACCOUNT_KEYS = {
  ALL: ['account'] as const,
  PROFILE: () => [...ACCOUNT_KEYS.ALL, 'profile'] as const,
};

const WORK_EXPERIENCE_KEYS = {
  ALL: ['work-experiences'] as const,
  GET_ALL: () => [...WORK_EXPERIENCE_KEYS.ALL, 'get-work-experiences'] as const,
  DETAIL: (id: number | string) => [...WORK_EXPERIENCE_KEYS.ALL, 'detail', id] as const,
};

const JURY_EXPERIENCE_KEYS = {
  ALL: ['jury-experiences'] as const,
  GET_ALL: () => [...JURY_EXPERIENCE_KEYS.ALL, 'get-jury-experiences'] as const,
  ALL_JURIES: () => [...JURY_EXPERIENCE_KEYS.ALL, 'all-juries'] as const,
  DETAIL: (id: number | string) => [...JURY_EXPERIENCE_KEYS.ALL, 'detail', id] as const,
};

const CARD_KEYS = {
  ALL: ['card'] as const,
  CONNECTED_USERS: () => [...CARD_KEYS.ALL, 'connected-users'] as const,
};

const AWARD_RECORD_KEYS = {
  ALL: ['award-records'] as const,
  GET_ALL: () => [...AWARD_RECORD_KEYS.ALL, 'get-award-records'] as const,
  DETAIL: (id: number | string) => [...AWARD_RECORD_KEYS.ALL, 'detail', id] as const,
};

export const QUERY_KEYS = {
  WORK_EXPERIENCE: WORK_EXPERIENCE_KEYS,
  JURY_EXPERIENCE: JURY_EXPERIENCE_KEYS,
  ACCOUNT: ACCOUNT_KEYS,
  CARD: CARD_KEYS,
  AWARD_RECORD: AWARD_RECORD_KEYS,
};
