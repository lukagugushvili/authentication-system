import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRoles } from 'src/enums/roles-enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: UserRoles.USER, enum: UserRoles })
  role: UserRoles;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
