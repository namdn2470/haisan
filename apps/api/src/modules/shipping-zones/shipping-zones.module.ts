import { Module } from '@nestjs/common';
import { ShippingZonesController } from './shipping-zones.controller';
import { ShippingZonesService } from './shipping-zones.service';

@Module({
  controllers: [ShippingZonesController],
  providers: [ShippingZonesService],
  exports: [ShippingZonesService],
})
export class ShippingZonesModule {}
