import type { Organizacion } from '@prisma/client';

export class OrganizacionResponseDto {
  id!: string;
  nombre!: string;
  slug!: string;
  zonaHoraria!: string;
  logoUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(organizacion: Organizacion): OrganizacionResponseDto {
    return Object.assign(new OrganizacionResponseDto(), {
      id: organizacion.id,
      nombre: organizacion.nombre,
      slug: organizacion.slug,
      zonaHoraria: organizacion.zonaHoraria,
      logoUrl: organizacion.logoUrl,
      createdAt: organizacion.createdAt,
      updatedAt: organizacion.updatedAt,
    });
  }
}

export class OrganizacionConMiembrosResponseDto extends OrganizacionResponseDto {
  /** Miembros con estado ACTIVO en la organización. */
  miembrosActivos!: number;

  static desdeConConteo(
    organizacion: Organizacion,
    miembrosActivos: number,
  ): OrganizacionConMiembrosResponseDto {
    return Object.assign(
      new OrganizacionConMiembrosResponseDto(),
      OrganizacionResponseDto.desde(organizacion),
      {
        miembrosActivos,
      },
    );
  }
}
