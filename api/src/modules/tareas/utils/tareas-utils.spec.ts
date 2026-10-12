import { describirCambios, type FotoTarea } from './describir-cambios.util';
import { detectarTipoArchivo } from './tipo-archivo.util';

const base: FotoTarea = {
  titulo: 'Inspección',
  estado: 'PENDIENTE',
  prioridad: 'MEDIA',
  fechaInicio: new Date('2026-10-12T14:00:00Z'),
  fechaFin: new Date('2026-10-12T15:00:00Z'),
  ubicacion: null,
  descripcion: null,
  etiquetas: ['Diseño'],
  asignados: [{ usuarioId: 'u1', nombre: 'Ana Pérez' }],
  subtareas: [
    { id: 's1', titulo: 'Paso 1', completada: false },
    { id: 's2', titulo: 'Paso 2', completada: false },
  ],
};

describe('describirCambios', () => {
  it('sin cambios no registra nada', () => {
    expect(describirCambios(base, { ...base }, 'u9', 'America/Lima')).toEqual(
      [],
    );
  });

  it('describe cada cambio con su tipo', () => {
    const despues: FotoTarea = {
      ...base,
      titulo: 'Inspección final',
      estado: 'REVISION',
      prioridad: 'ALTA',
      fechaFin: new Date('2026-10-12T16:30:00Z'),
      ubicacion: 'Sala B',
      descripcion: 'nueva',
      etiquetas: ['Marketing'],
      asignados: [{ usuarioId: 'u2', nombre: 'Luis Díaz' }],
      subtareas: [
        { id: 's1', titulo: 'Paso uno', completada: true },
        { id: 's3', titulo: 'Paso 3', completada: false },
      ],
    };
    expect(describirCambios(base, despues, 'u9', 'America/Lima')).toEqual([
      { tipo: 'EDITADA', descripcion: 'cambió el título a «Inspección final»' },
      { tipo: 'ESTADO', descripcion: 'movió la tarea a Revisión' },
      { tipo: 'EDITADA', descripcion: 'cambió la prioridad a Alta' },
      {
        tipo: 'EDITADA',
        descripcion: 'cambió el horario a 12 oct, 09:00 - 11:30',
      },
      { tipo: 'EDITADA', descripcion: 'cambió la ubicación a «Sala B»' },
      { tipo: 'EDITADA', descripcion: 'actualizó la descripción' },
      { tipo: 'EDITADA', descripcion: 'añadió la etiqueta «Marketing»' },
      { tipo: 'EDITADA', descripcion: 'quitó la etiqueta «Diseño»' },
      { tipo: 'ASIGNADOS', descripcion: 'asignó a Luis Díaz' },
      { tipo: 'ASIGNADOS', descripcion: 'quitó a Ana Pérez' },
      { tipo: 'SUBTAREA', descripcion: 'renombró «Paso 1» a «Paso uno»' },
      { tipo: 'SUBTAREA', descripcion: 'completó «Paso uno»' },
      { tipo: 'SUBTAREA', descripcion: 'añadió la subtarea «Paso 3»' },
      { tipo: 'SUBTAREA', descripcion: 'eliminó la subtarea «Paso 2»' },
    ]);
  });

  it('habla en primera persona cuando quien edita se asigna o se quita', () => {
    const conmigo = {
      ...base,
      asignados: [...base.asignados, { usuarioId: 'u9', nombre: 'Yo' }],
    };
    expect(describirCambios(base, conmigo, 'u9', 'UTC')).toEqual([
      { tipo: 'ASIGNADOS', descripcion: 'se asignó la tarea' },
    ]);
    expect(describirCambios(conmigo, base, 'u9', 'UTC')).toEqual([
      { tipo: 'ASIGNADOS', descripcion: 'se quitó de la tarea' },
    ]);
  });
});

describe('detectarTipoArchivo', () => {
  const de = (...bytes: number[]) =>
    Buffer.from([...bytes, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  it('reconoce PDF e imágenes por su contenido', () => {
    expect(detectarTipoArchivo(Buffer.from('%PDF-1.7\n...'))).toEqual({
      mime: 'application/pdf',
      tipo: 'ARCHIVO',
    });
    expect(
      detectarTipoArchivo(de(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toEqual({ mime: 'image/png', tipo: 'IMAGEN' });
    expect(detectarTipoArchivo(de(0xff, 0xd8, 0xff, 0xe0))).toEqual({
      mime: 'image/jpeg',
      tipo: 'IMAGEN',
    });
    expect(detectarTipoArchivo(Buffer.from('GIF89a......'))).toEqual({
      mime: 'image/gif',
      tipo: 'IMAGEN',
    });
    expect(
      detectarTipoArchivo(
        Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'latin1'),
      ),
    ).toEqual({ mime: 'image/webp', tipo: 'IMAGEN' });
  });

  it('rechaza otros formatos aunque se disfracen', () => {
    expect(detectarTipoArchivo(Buffer.from('hola, soy un texto'))).toBeNull();
    expect(
      detectarTipoArchivo(Buffer.from('PK\x03\x04 docx', 'latin1')),
    ).toBeNull();
    expect(detectarTipoArchivo(Buffer.alloc(0))).toBeNull();
  });
});
