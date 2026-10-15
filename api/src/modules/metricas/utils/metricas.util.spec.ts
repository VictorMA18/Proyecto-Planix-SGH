import {
  agregarPeriodo,
  buscarColaboradores,
  minutosExtra,
  nivelDePuntualidad,
  ordenarColaboradores,
  periodoAnterior,
  rangoDelPeriodo,
  registroDiario,
  resumenColaborador,
  tramoComparable,
  tramosDeBarras,
  variacion,
  type JornadaCalculo,
  type MiembroCalculo,
} from './metricas.util';

const entrada = new Date('2026-10-12T13:00:00Z');

/** Jornada con turno de 9 h (540 min) salvo que se indique otro. */
function jornada(
  fecha: string,
  minutos: number,
  puntual: boolean | null = true,
  turnoMin: number | null = 540,
): JornadaCalculo {
  return {
    fecha,
    minutos,
    puntual,
    minutosTarde: puntual === false ? 20 : puntual === null ? null : 0,
    turnoMin,
    entrada,
    salida: null,
    escaneos: [
      { tipo: 'ENTRADA', hora: entrada },
      { tipo: 'SALIDA', hora: entrada },
    ],
  };
}

function miembro(
  nombre: string,
  jornadas: JornadaCalculo[],
  conTurno = true,
): MiembroCalculo {
  return {
    miembroId: `id-${nombre}`,
    nombre,
    email: `${nombre.toLowerCase()}@planix.test`,
    avatarUrl: null,
    rol: 'EMPLEADO',
    turno: conTurno ? 'Mañana' : null,
    plantilla: conTurno ? { dias: [1, 2, 3, 4, 5], duracionMin: 540 } : null,
    jornadas,
  };
}

// Jueves 15 de octubre de 2026 (el lunes 12 empieza la semana).
const HOY = '2026-10-15';

describe('métricas del periodo', () => {
  it('rangos de semana (lunes a domingo) y de mes, y su periodo anterior', () => {
    const semana = rangoDelPeriodo('SEMANA', HOY);
    expect(semana).toEqual({ desde: '2026-10-12', hasta: '2026-10-18' });
    expect(periodoAnterior('SEMANA', semana)).toEqual({
      desde: '2026-10-05',
      hasta: '2026-10-11',
    });
    const mes = rangoDelPeriodo('MES', '2026-03-20');
    expect(mes).toEqual({ desde: '2026-03-01', hasta: '2026-03-31' });
    expect(periodoAnterior('MES', mes)).toEqual({
      desde: '2026-02-01',
      hasta: '2026-02-28',
    });
  });

  it('compara el periodo en curso solo hasta el mismo punto del anterior', () => {
    const semana = rangoDelPeriodo('SEMANA', HOY);
    const anterior = periodoAnterior('SEMANA', semana);
    expect(tramoComparable(semana, anterior, HOY)).toEqual({
      desde: '2026-10-05',
      hasta: '2026-10-08',
    });
    // Un periodo ya cerrado se compara completo.
    expect(tramoComparable(anterior, semana, HOY)).toEqual(semana);
    // 31 de marzo frente a febrero: se corta en el último día de febrero.
    const marzo = rangoDelPeriodo('MES', '2026-03-31');
    expect(
      tramoComparable(marzo, periodoAnterior('MES', marzo), '2026-03-31'),
    ).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
  });

  it('barras: 7 días en la semana y semanas (lunes a domingo) en el mes', () => {
    expect(
      tramosDeBarras('SEMANA', rangoDelPeriodo('SEMANA', HOY)).map(
        (b) => b.etiqueta,
      ),
    ).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
    // Octubre de 2026 empieza en jueves.
    const mes = tramosDeBarras('MES', rangoDelPeriodo('MES', HOY));
    expect(mes.map((b) => [b.etiqueta, b.desde, b.hasta])).toEqual([
      ['S1', '2026-10-01', '2026-10-04'],
      ['S2', '2026-10-05', '2026-10-11'],
      ['S3', '2026-10-12', '2026-10-18'],
      ['S4', '2026-10-19', '2026-10-25'],
      ['S5', '2026-10-26', '2026-10-31'],
    ]);
  });

  it('horas extra solo por encima del turno del día; nivel y variación', () => {
    expect(minutosExtra(jornada(HOY, 600))).toBe(60);
    expect(minutosExtra(jornada(HOY, 500))).toBe(0);
    expect(minutosExtra(jornada(HOY, 600, null, null))).toBe(0);
    expect(nivelDePuntualidad(96)).toBe('EXCELENTE');
    expect(nivelDePuntualidad(85)).toBe('BUENO');
    expect(nivelDePuntualidad(70)).toBe('MEJORABLE');
    expect(nivelDePuntualidad(null)).toBeNull();
    expect(variacion(110, 100)).toBe(10);
    expect(variacion(10, 0)).toBeNull();
  });

  it('resumen de un colaborador: asistencia, puntualidad, extra y meta hasta hoy', () => {
    const ana = miembro('Ana', [
      jornada('2026-10-12', 600), // 1 h extra
      jornada('2026-10-13', 540, false),
      jornada('2026-10-14', 540),
      jornada('2026-10-15', 540),
      jornada('2026-10-09', 540), // semana anterior: no cuenta
    ]);
    expect(
      resumenColaborador(ana, rangoDelPeriodo('SEMANA', HOY), HOY),
    ).toEqual(
      expect.objectContaining({
        diasTrabajados: 4,
        asistenciaPct: 100, // 4 de 4 días de turno hasta el jueves
        puntualidadPct: 75,
        horas: 37, // 2220 min
        horasExtra: 1,
        metaAlcanzada: true, // 2220 ≥ 4 × 540
      }),
    );

    const sinTurno = miembro(
      'Beto',
      [jornada('2026-10-12', 300, null, null)],
      false,
    );
    expect(
      resumenColaborador(sinTurno, rangoDelPeriodo('SEMANA', HOY), HOY),
    ).toEqual(
      expect.objectContaining({
        asistenciaPct: null,
        puntualidadPct: null,
        horas: 5,
        horasExtra: 0,
        metaAlcanzada: false,
      }),
    );
  });

  it('ordena por horas y busca sin acentos ni mayúsculas', () => {
    const rango = rangoDelPeriodo('SEMANA', HOY);
    const filas = [
      miembro('Sofía', [jornada('2026-10-12', 300)]),
      miembro('Carlos', [jornada('2026-10-12', 600)]),
      miembro('Ana', [jornada('2026-10-12', 300)]),
    ].map((m) => resumenColaborador(m, rango, HOY));
    expect(ordenarColaboradores(filas).map((f) => f.nombre)).toEqual([
      'Carlos',
      'Ana',
      'Sofía',
    ]);
    expect(buscarColaboradores(filas, 'SOFIA').map((f) => f.nombre)).toEqual([
      'Sofía',
    ]);
    expect(buscarColaboradores(filas, undefined)).toHaveLength(3);
  });

  it('agrega el equipo: horas, planificadas, puntualidad, extra y tendencia', () => {
    const equipo = [
      miembro('Ana', [
        jornada('2026-10-12', 600),
        jornada('2026-10-15', 540, false),
        jornada('2026-10-05', 480), // lunes anterior
      ]),
      miembro('Carlos', [
        jornada('2026-10-12', 540),
        jornada('2026-10-06', 420),
      ]),
    ];
    const rango = rangoDelPeriodo('SEMANA', HOY);
    const total = agregarPeriodo(equipo, 'SEMANA', rango, HOY);

    expect(total.horas).toEqual({
      trabajadas: 28, // 600 + 540 + 540 = 1680 min
      planificadas: 90, // 2 × 5 días × 9 h
      restantes: 62,
      cumplimientoPct: 31.1,
    });
    expect(total.puntualidad).toEqual({
      porcentaje: 66.7,
      aTiempo: 2,
      evaluadas: 3,
      nivel: 'MEJORABLE',
    });
    expect(total.horasExtra).toEqual({ total: 1, hoy: 0 });
    expect(total.tendencia.barras.map((b) => b.horas)).toEqual([
      19, 0, 0, 9, 0, 0, 0,
    ]);
    // 1680 min en 2 días con actividad.
    expect(total.tendencia.promedioDiarioHoras).toBe(14);
    // Frente a lun 5 – jue 8: 480 + 420 = 900 min.
    expect(total.tendencia.variacionPct).toBe(86.7);
    expect(total.tendencia.metaDiariaHoras).toBe(9);
    // Lunes 12 (19 h) frente al lunes 5 (8 h).
    expect(total.tendencia.mejor).toEqual({
      etiqueta: 'Lunes',
      horas: 19,
      variacionPct: 137.5,
    });
  });

  it('sin jornadas no hay barra destacada ni variación', () => {
    const total = agregarPeriodo(
      [miembro('Ana', [])],
      'MES',
      rangoDelPeriodo('MES', HOY),
      HOY,
    );
    expect(total.tendencia.mejor).toBeNull();
    expect(total.tendencia.variacionPct).toBeNull();
    expect(total.puntualidad.nivel).toBeNull();
    expect(total.horas.planificadas).toBe(198); // 22 días × 9 h
  });

  it('registro diario hasta hoy, del más reciente al más antiguo', () => {
    const ana = miembro('Ana', [
      jornada('2026-10-12', 600),
      jornada('2026-10-14', 540, false),
    ]);
    const dias = registroDiario(ana, rangoDelPeriodo('SEMANA', HOY), HOY);
    expect(dias.map((d) => d.fecha)).toEqual([
      '2026-10-15',
      '2026-10-14',
      '2026-10-13',
      '2026-10-12',
    ]);
    expect(dias[0]).toEqual(
      expect.objectContaining({ conTurno: true, entrada: null, horas: 0 }),
    );
    expect(dias[1]).toEqual(
      expect.objectContaining({ puntual: false, minutosTarde: 20, horas: 9 }),
    );
    expect(dias[3]).toEqual(
      expect.objectContaining({ horas: 10, horasExtra: 1, marcas: 2 }),
    );
    // Un periodo futuro no tiene días.
    expect(
      registroDiario(ana, rangoDelPeriodo('SEMANA', '2026-10-20'), HOY),
    ).toEqual([]);
  });
});
