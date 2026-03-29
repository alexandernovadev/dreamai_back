import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI')?.trim();
        if (!uri) {
          throw new Error('Missing MONGODB_URI (MongoDB connection string)');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
