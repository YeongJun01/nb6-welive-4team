import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const createNotice = s.object({
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

const updateNotice = s.assign(
  createNotice,
  s.object({
    userId: commonStruct.uuid,
  }),
);

export default {
  createNotice,
  updateNotice,
};
