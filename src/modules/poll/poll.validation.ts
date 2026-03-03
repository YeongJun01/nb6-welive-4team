import isUuid from 'is-uuid';
import * as s from 'superstruct';

const userInfo = s.object({
  id: s.string(),
  boardIds: s.object({
    POLL: s.string(),
  }),
});

const createPoll = s.object({
  boardId: s.string(),
  status: s.enums(['PENDING', 'IN_PROGRESS', 'CLOSED']),
  buildingPermission: s.array(s.string()),
  title: s.string(),
  content: s.string(),
  startDate: s.string(),
  endDate: s.string(),
  options: s.array(s.object({ title: s.string() })),
});

const getPollList = s.object({
  page: s.defaulted(s.number(), 1),
  limit: s.defaulted(s.number(), 11),
  buildingPermission: s.defaulted(s.array(s.string()), ['all']), // 투표권한 프론트 수정 필요
  status: s.defaulted(s.enums(['PENDING', 'IN_PROGRESS', 'CLOSED', 'ALL']), 'ALL'),
  keyword: s.defaulted(s.string(), ''),
  orderBy: s.defaulted(s.enums(['oldest', 'newest']), 'newest'),
});

export default {
  createPoll,
  getPollList,
};
