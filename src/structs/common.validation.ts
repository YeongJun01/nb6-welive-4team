import isUuid from 'is-uuid';
import * as s from 'superstruct';

const uuid = s.define<string>('uuid', (value: any) => isUuid.v4(value));

export default {
  uuid,
};
