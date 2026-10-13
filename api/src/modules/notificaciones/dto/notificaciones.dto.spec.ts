import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DifusionDto } from './difusion.dto';
import {
  NotificacionesQueryDto,
  NotificacionIdParamDto,
} from './notificaciones-query.dto';
import { PreferenciasNotificacionDto } from './preferencias-notificacion.dto';
import { QuitarPushTokenDto, RegistrarPushTokenDto } from './push-token.dto';

const ID = '3f2a8c1e-5b7d-4e9f-a1c2-0d4e6f8a9b10';

const errores = async <T extends object>(clase: new () => T, plano: object) =>
  (await validate(plainToInstance(clase, plano))).map((e) => e.property);

describe('NotificacionesQueryDto', () => {
  it('convierte «leida» y la paginación, con 50 por defecto', async () => {
    const dto = plainToInstance(NotificacionesQueryDto, {
      leida: 'false',
      page: '2',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ leida: false, page: 2, pageSize: 50 });
  });

  it('rechaza un booleano mal escrito, una organización inválida y más de 100 por página', async () => {
    expect(
      await errores(NotificacionesQueryDto, {
        leida: 'si',
        organizacionId: 'x',
        pageSize: '101',
      }),
    ).toEqual(expect.arrayContaining(['leida', 'organizacionId', 'pageSize']));
  });

  it('exige un UUID como id de notificación', async () => {
    expect(
      await errores(NotificacionIdParamDto, { notificacionId: 'abc' }),
    ).toEqual(['notificacionId']);
  });
});

describe('PreferenciasNotificacionDto', () => {
  it('acepta las cuatro preferencias', async () => {
    expect(
      await errores(PreferenciasNotificacionDto, {
        push: true,
        recordatoriosFichaje: false,
        novedadesTareas: true,
        modoAlerta: 'VIBRACION',
      }),
    ).toEqual([]);
  });

  it('rechaza un modo desconocido y los campos que faltan', async () => {
    expect(
      await errores(PreferenciasNotificacionDto, {
        push: 'si',
        modoAlerta: 'FUERTE',
      }),
    ).toEqual(
      expect.arrayContaining([
        'push',
        'recordatoriosFichaje',
        'novedadesTareas',
        'modoAlerta',
      ]),
    );
  });
});

describe('DifusionDto', () => {
  it('recorta los textos y permite omitir los destinatarios', async () => {
    const dto = plainToInstance(DifusionDto, {
      titulo: '  Reunión general ',
      contenido: ' El viernes a las 9 ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      titulo: 'Reunión general',
      contenido: 'El viernes a las 9',
    });
  });

  it('rechaza títulos cortos, mensajes vacíos o largos y listas vacías o repetidas', async () => {
    expect(
      await errores(DifusionDto, {
        titulo: 'Hi',
        contenido: '   ',
        miembroIds: [],
      }),
    ).toEqual(expect.arrayContaining(['titulo', 'contenido', 'miembroIds']));
    expect(
      await errores(DifusionDto, {
        titulo: 'Aviso',
        contenido: 'x'.repeat(501),
        miembroIds: [ID, ID],
      }),
    ).toEqual(expect.arrayContaining(['contenido', 'miembroIds']));
    expect(
      await errores(DifusionDto, {
        titulo: 'Aviso',
        contenido: 'Hola',
        miembroIds: ['no-es-uuid'],
      }),
    ).toEqual(['miembroIds']);
  });
});

describe('RegistrarPushTokenDto', () => {
  const suscripcion = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'BNc', auth: 'tBH' },
  };

  it('exige el token de Expo en Android e iOS', async () => {
    expect(
      await errores(RegistrarPushTokenDto, {
        plataforma: 'ANDROID',
        expoPushToken: 'ExponentPushToken[abc]',
      }),
    ).toEqual([]);
    expect(await errores(RegistrarPushTokenDto, { plataforma: 'IOS' })).toEqual(
      ['expoPushToken'],
    );
  });

  it('exige una suscripción completa y https en la web', async () => {
    expect(
      await errores(RegistrarPushTokenDto, {
        plataforma: 'WEB',
        webPushSubscription: suscripcion,
      }),
    ).toEqual([]);
    expect(await errores(RegistrarPushTokenDto, { plataforma: 'WEB' })).toEqual(
      ['webPushSubscription'],
    );
    expect(
      await errores(RegistrarPushTokenDto, {
        plataforma: 'WEB',
        webPushSubscription: {
          endpoint: 'http://inseguro.test',
          keys: { p256dh: 'x' },
        },
      }),
    ).toEqual(['webPushSubscription']);
  });

  it('rechaza una plataforma desconocida', async () => {
    expect(
      await errores(RegistrarPushTokenDto, {
        plataforma: 'WINDOWS',
        expoPushToken: 'x',
      }),
    ).toEqual(['plataforma']);
  });
});

describe('QuitarPushTokenDto', () => {
  it('acepta el token o el endpoint, y rechaza que falten ambos', async () => {
    expect(await errores(QuitarPushTokenDto, { expoPushToken: 'x' })).toEqual(
      [],
    );
    expect(
      await errores(QuitarPushTokenDto, { endpoint: 'https://e.test' }),
    ).toEqual([]);
    expect(await errores(QuitarPushTokenDto, {})).toEqual(
      expect.arrayContaining(['expoPushToken', 'endpoint']),
    );
  });
});
