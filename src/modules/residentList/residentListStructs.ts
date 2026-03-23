import { object, string, enums, optional } from 'superstruct';

export const CreateResident = object({
  building: string(),
  unitNumber: string(),
  contact: string(),
  name: string(),
  isHouseholder: enums(['HOUSEHOLDER', 'MEMBER']),
});

export const UpdateResident = object({
  building: optional(string()),
  unitNumber: optional(string()),
  contact: optional(string()),
  name: optional(string()),
  isHouseholder: optional(enums(['HOUSEHOLDER', 'MEMBER'])),
});
