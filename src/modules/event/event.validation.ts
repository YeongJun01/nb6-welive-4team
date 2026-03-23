import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const getEventList = s.object({
  apartmentId: commonStruct.uuid,
  year: s.refine(commonStruct.number, 'year-range', (val) => val >= 2000 && val <= 3000),
  month: s.refine(commonStruct.number, 'month-range', (val) => val >= 1 && val <= 12),
});

export default {
  getEventList,
};
