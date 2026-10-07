import React from 'react';

import { ChoiceChips } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { RoleColors } from '@/constants/theme';
import { inviteRoleSchema, type InviteRole } from '@/schemas/team.schema';

interface RolePickerProps {
  value: InviteRole | undefined;
  onChange: (role: InviteRole) => void;
  error?: string;
}

export const RolePicker: React.FC<RolePickerProps> = ({ value, onChange, error }) => (
  <ChoiceChips
    label="Rol en la organización"
    value={value}
    onChange={onChange}
    error={error}
    options={inviteRoleSchema.options.map((role) => ({
      value: role,
      label: ROLE_NAME[role],
      accent: RoleColors[role].accent,
    }))}
  />
);
