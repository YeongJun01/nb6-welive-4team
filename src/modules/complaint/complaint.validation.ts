import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const userInfo = s.object({
  id: commonStruct.uuid,
  boardIds: s.object({
    COMPLAINT: commonStruct.uuid,
  }),
});

const complaintInformation = s.object({
  title: s.string(),
  content: s.string(),
  isPublic: commonStruct.boolean,
  boardId: commonStruct.uuid,
  status: s.enums(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
});

const getComplaintList = s.assign(
  // 기본 조회 설정 : page, limit, orderBy
  commonStruct.pagination,
  s.object({
    status: s.optional(s.enums(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])),
    isPublic: s.defaulted(commonStruct.boolean, true),
    keyword: s.optional(s.string()),
    dong: s.optional(s.string()),
    ho: s.optional(s.string()),
  }),
);

const complaintStatus = s.object({
  status: s.enums(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
});

const complaintUpdate = s.object({
  title: s.string(),
  content: s.string(),
  isPublic: commonStruct.boolean,
});

export default {
  complaintInformation,
  userInfo,
  getComplaintList,
  complaintStatus,
  complaintUpdate,
};
