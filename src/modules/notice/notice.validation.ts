import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const noticeInfo = s.object({
  category: s.enums([
    'MAINTENANCE',
    'EMERGENCY',
    'COMMUNITY',
    'RESIDENT_VOTE',
    'RESIDENT_COUNCIL',
    'ETC',
  ]),
  title: s.string(),
  content: s.string(),
  boardId: commonStruct.uuid,
  isPinned: commonStruct.boolean,
  startDate: s.optional(commonStruct.date),
  endDate: s.optional(commonStruct.date),
});

const getNoticeList = s.assign(
  // 기본 조회 설정 : page, limit, orderBy
  commonStruct.pagination,
  s.object({
    category: s.optional(
      s.enums([
        'MAINTENANCE',
        'EMERGENCY',
        'COMMUNITY',
        'RESIDENT_VOTE',
        'RESIDENT_COUNCIL',
        'ETC',
      ]),
    ),
    search: s.optional(s.string()),
  }),
);

export default {
  noticeInfo,
  getNoticeList,
};
