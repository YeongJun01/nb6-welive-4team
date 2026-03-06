import isUuid from 'is-uuid';
import * as s from 'superstruct';

const uuid = s.define<string>('uuid', (value: any) => isUuid.v4(value));

const boolean = s.coerce(s.boolean(), s.string(), (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
});

export default {
  uuid,
  boolean,
};
