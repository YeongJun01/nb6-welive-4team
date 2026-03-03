import isUuid from 'is-uuid';
import * as s from 'superstruct';

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

export default {
  createPoll,
};
