import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const userInfo = s.object({
  id: commonStruct.uuid,
  boardIds: s.object({
    POLL: commonStruct.uuid,
  }),
});

const pollInformation = s.object({
  boardId: commonStruct.uuid,
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
  buildingPermission: s.optional(s.array(s.string())), // 투표권한 프론트 수정 필요
  status: s.defaulted(s.enums(['PENDING', 'IN_PROGRESS', 'CLOSED', 'ALL']), 'ALL'),
  keyword: s.defaulted(s.string(), ''),
  orderBy: s.defaulted(s.enums(['oldest', 'newest']), 'newest'),
});

const getPollId = s.object({
  pollId: commonStruct.uuid,
});

export default {
  pollInformation,
  getPollList,
  getPollId,
  userInfo,
};
