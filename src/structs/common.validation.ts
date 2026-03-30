import isUuid from 'is-uuid';
import * as s from 'superstruct';

const uuid = s.define<string>('uuid', (value: unknown) => isUuid.v4(value as string));

const number = s.coerce(s.number(), s.string(), (value) => Number(value));

const boolean = s.coerce(s.boolean(), s.string(), (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
});

const date = s.coerce(s.date(), s.string(), (value) => new Date(value));

const stringArray = s.coerce(
  s.array(s.string()),
  s.union([s.string(), s.array(s.string())]),
  (value) => (Array.isArray(value) ? value : [value]),
);

const pagination = s.object({
  page: s.defaulted(number, 1),
  limit: s.defaulted(number, 11),
  orderBy: s.defaulted(s.enums(['oldest', 'newest']), 'newest'),
});

export default {
  uuid,
  number,
  boolean,
  date,
  stringArray,
  pagination,
};
