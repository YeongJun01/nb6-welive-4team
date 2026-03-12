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

const getPollList = s.assign(
  // 기본 조회 설정 : page, limit, orderBy
  commonStruct.pagination,
  s.object({
    buildingPermission: s.optional(commonStruct.stringArray),
    status: s.defaulted(s.enums(['PENDING', 'IN_PROGRESS', 'CLOSED', 'ALL']), 'ALL'),
    keyword: s.optional(s.string()),
  }),
);

const getPollId = s.object({
  pollId: commonStruct.uuid,
});

export default {
  pollInformation,
  getPollList,
  getPollId,
  userInfo,
};
