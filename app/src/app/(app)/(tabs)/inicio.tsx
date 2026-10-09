import React from 'react';

import { MembershipsState } from '@/components/organizations';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { AdminHome, EmployeeHome } from '@/screens/home';

/** Inicio: el contenido depende del rol del usuario en la organización activa. */
export default function HomeScreen() {
  const { role, isPending, isError, error, refetch } = useActiveOrganization();

  if (isPending) return <MembershipsState status="loading" loadingText="Cargando tu organización…" />;

  if (isError) {
    return (
      <MembershipsState
        status="error"
        errorTitle="No pudimos cargar tu organización"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!role) {
    return (
      <MembershipsState
        status="empty"
        emptyTitle="Elige una organización"
        emptyMessage="Vuelve al selector de organizaciones para continuar."
      />
    );
  }

  // ADMIN y SUPER_ADMIN ven el panel de control; EMPLEADO y SUPERVISOR, su jornada.
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return <AdminHome />;
  return <EmployeeHome showQuickActions={role === 'SUPERVISOR'} />;
}
