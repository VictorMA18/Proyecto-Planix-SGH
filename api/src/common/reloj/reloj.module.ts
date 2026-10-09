import { Global, Module } from '@nestjs/common';
import { RelojService } from './reloj.service';

@Global()
@Module({
  providers: [RelojService],
  exports: [RelojService],
})
export class RelojModule {}
