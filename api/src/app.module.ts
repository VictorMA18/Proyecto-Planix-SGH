import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { InvitacionesModule } from './modules/invitaciones/invitaciones.module';
import { OrganizacionesModule } from './modules/organizaciones/organizaciones.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, OrganizacionesModule, InvitacionesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
