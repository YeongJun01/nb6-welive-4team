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
  status: s.enums(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
});

export default {
  complaintInformation,
  userInfo,
};
