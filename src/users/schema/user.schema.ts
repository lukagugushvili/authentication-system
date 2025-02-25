import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRoles } from 'src/enums/roles-enum';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ default: UserRoles.USER, enum: UserRoles })
  role: UserRoles;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
