import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ADJUNTO_MAX_BYTES } from '../../../common/constants/tareas.constants';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ArchivoDemasiadoGrandeFilter } from '../../../common/filters/archivo-demasiado-grande.filter';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { ArchivoQueryDto } from '../dto/archivo-query.dto';
import { AdjuntoParamDto, TareaIdParamDto } from '../dto/tarea-params.dto';
import { AdjuntoResponseDto } from '../dto/tarea-response.dto';
import {
  AdjuntosService,
  type ArchivoRecibido,
} from '../services/adjuntos.service';

/** Adjuntos de una tarea (multipart). El archivo pasa por el backend, nunca directo a Cloudinary. */
@Controller('tareas/:tareaId/adjuntos')
@UseGuards(ClerkAuthGuard)
@UseFilters(ArchivoDemasiadoGrandeFilter)
export class AdjuntosController {
  constructor(
    private readonly adjuntos: AdjuntosService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post()
  // Un byte más que el máximo: si multer corta, el archivo supera los 10 MB (→ 413).
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: ADJUNTO_MAX_BYTES + 1, files: 1 },
    }),
  )
  async subir(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
    @UploadedFile() archivo: ArchivoRecibido | undefined,
  ): Promise<AdjuntoResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.adjuntos.subir(usuario, tareaId, archivo);
  }

  /**
   * El archivo con su tipo y su nombre original: para el visor (`inline`) o para descargarlo
   * (`?descargar=true`). Cualquier miembro de la organización.
   */
  @Get(':adjuntoId/archivo')
  async archivo(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId, adjuntoId }: AdjuntoParamDto,
    @Query() { descargar }: ArchivoQueryDto,
  ): Promise<StreamableFile> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    const { contenido, adjunto } = await this.adjuntos.archivo(
      usuario,
      tareaId,
      adjuntoId,
    );
    // Nombre ASCII de respaldo y el original en UTF-8 (RFC 6266) para tildes y eñes.
    const ascii = adjunto.nombreArchivo
      .normalize('NFD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/["\\]/g, '_');
    return new StreamableFile(contenido, {
      type: adjunto.mimeType,
      length: contenido.length,
      disposition: `${descargar ? 'attachment' : 'inline'}; filename="${ascii || 'archivo'}"; filename*=UTF-8''${encodeURIComponent(adjunto.nombreArchivo)}`,
    });
  }

  @Delete(':adjuntoId')
  @HttpCode(204)
  async eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId, adjuntoId }: AdjuntoParamDto,
  ): Promise<void> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    await this.adjuntos.eliminar(usuario, tareaId, adjuntoId);
  }
}
