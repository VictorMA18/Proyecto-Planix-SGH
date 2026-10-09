import {
  crearTokenQr,
  finDeVentana,
  firmaValida,
  leerTokenQr,
  ventanaDe,
} from './qr-token.util';

const ID = '3f2a8c1e-5b7d-4e9f-a1c2-0d4e6f8a9b10';
const SECRETO = 'secreto-de-prueba';

describe('qr-token.util', () => {
  it('crea un token que se puede leer y verificar', () => {
    const ventana = ventanaDe(new Date('2026-10-09T13:00:30Z'));
    const token = crearTokenQr(ID, SECRETO, ventana);
    const leido = leerTokenQr(token);

    expect(token.startsWith('PLX1.')).toBe(true);
    expect(leido).toMatchObject({ codigoQrId: ID, ventana });
    expect(firmaValida(SECRETO, leido!)).toBe(true);
  });

  it('cambia de token al cambiar de ventana', () => {
    const v = ventanaDe(new Date('2026-10-09T13:00:00Z'));
    expect(crearTokenQr(ID, SECRETO, v)).not.toBe(
      crearTokenQr(ID, SECRETO, v + 1),
    );
    expect(finDeVentana(v).getTime()).toBeGreaterThan(
      new Date('2026-10-09T13:00:00Z').getTime(),
    );
  });

  it('rechaza una firma alterada o de otro secreto', () => {
    const leido = leerTokenQr(crearTokenQr(ID, SECRETO, 100))!;
    expect(firmaValida('otro-secreto', leido)).toBe(false);
    expect(firmaValida(SECRETO, { ...leido, ventana: 101 })).toBe(false);
    expect(
      firmaValida(SECRETO, { ...leido, firma: '0'.repeat(leido.firma.length) }),
    ).toBe(false);
  });

  it('no acepta textos con otro formato', () => {
    for (const texto of [
      '',
      'hola',
      `PLX1.${ID}.abc.123`,
      `XYZ.${ID}.1.${'a'.repeat(20)}`,
    ]) {
      expect(leerTokenQr(texto)).toBeNull();
    }
  });
});
