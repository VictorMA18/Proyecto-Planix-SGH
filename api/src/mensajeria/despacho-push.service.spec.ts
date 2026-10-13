import { DespachoPushService } from './despacho-push.service';
import type { ExpoPushService } from './expo-push.service';
import type { MensajePush } from './mensaje-push.interface';
import type { WebPushService } from './web-push.service';
import type { PrismaService } from '../prisma/prisma.service';

const mensaje: MensajePush = {
  usuarioIds: ['u1', 'u2', 'u3'],
  titulo: 'Nueva tarea asignada',
  contenido: 'Ana te asignó a «Inventario».',
  datos: {
    tipo: 'TAREA_ASIGNADA',
    notificacionId: 'n1',
    organizacionId: 'o1',
    referenciaId: 't1',
    url: '/tarea/t1',
  },
};

function crear() {
  const prisma = {
    preferenciasNotificacion: {
      // u2 apagó el push; u3 usa vibración; u1 no tiene fila (valores por defecto).
      findMany: jest.fn().mockResolvedValue([
        { usuarioId: 'u2', push: false, modoAlerta: 'SONIDO' },
        { usuarioId: 'u3', push: true, modoAlerta: 'VIBRACION' },
      ]),
    },
    pushToken: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'k1', usuarioId: 'u1', expoPushToken: 'ExponentPushToken[a]' },
        { id: 'k2', usuarioId: 'u3', expoPushToken: 'ExponentPushToken[b]' },
        {
          id: 'k3',
          usuarioId: 'u3',
          expoPushToken: null,
          webPushSuscripcion: { endpoint: 'https://w.test' },
        },
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const expo = {
    enviar: jest.fn().mockResolvedValue([
      { token: 'ExponentPushToken[a]', invalido: false },
      { token: 'ExponentPushToken[b]', invalido: true },
    ]),
  };
  const webPush = { enviar: jest.fn().mockResolvedValue({ invalido: false }) };
  const servicio = new DespachoPushService(
    prisma as unknown as PrismaService,
    expo as unknown as ExpoPushService,
    webPush as unknown as WebPushService,
  );
  return { servicio, prisma, expo, webPush };
}

describe('DespachoPushService', () => {
  it('envía solo a quien tiene el push encendido, con su modo de alerta', async () => {
    const { servicio, prisma, expo, webPush } = crear();
    await servicio.despachar(mensaje);

    expect(prisma.pushToken.findMany).toHaveBeenCalledWith({
      where: { usuarioId: { in: ['u1', 'u3'] }, activo: true },
    });
    const [[envios]] = expo.enviar.mock.calls as [
      [{ token: string; envio: { modoAlerta: string } }[]],
    ];
    expect(envios.map((e) => [e.token, e.envio.modoAlerta])).toEqual([
      ['ExponentPushToken[a]', 'SONIDO'],
      ['ExponentPushToken[b]', 'VIBRACION'],
    ]);
    expect(webPush.enviar).toHaveBeenCalledTimes(1);
  });

  it('desactiva los tokens inválidos y marca los usados', async () => {
    const { servicio, prisma } = crear();
    await servicio.despachar(mensaje);
    expect(prisma.pushToken.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['k2'] } },
      data: { activo: false },
    });
    expect(prisma.pushToken.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['k1', 'k3'] } },
      data: { ultimaVezUsado: expect.any(Date) as Date },
    });
  });

  it('no busca tokens si nadie tiene el push encendido', async () => {
    const { servicio, prisma, expo } = crear();
    await servicio.despachar({ ...mensaje, usuarioIds: ['u2'] });
    expect(prisma.pushToken.findMany).not.toHaveBeenCalled();
    expect(expo.enviar).not.toHaveBeenCalled();
  });
});
