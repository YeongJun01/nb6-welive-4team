import * as s from 'superstruct';
import commonStruct from '../../structs/common.validation';

const getEventList = s.object({
  apartmentId: commonStruct.uuid,
  year: commonStruct.number,
  month: commonStruct.number,
});

export default {
  getEventList,
};
