import { modelOptions, prop } from '@typegoose/typegoose'
import { defaultAvatarImg } from '@/util/constants'

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false } })
export class UserProvider {
  @prop()
  public name?: string

  @prop()
  public providerId?: string
}

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false } })
export class UserSettings {
  @prop()
  public defaultTimer?: number

  @prop()
  public autofillSessionName?: boolean
}

@modelOptions({ schemaOptions: { collection: 'User', versionKey: false, timestamps: true } })
class User {
  @prop({ required: true })
  public username: string

  @prop({ required: true })
  public email: string

  @prop({ default: defaultAvatarImg })
  public avatarImgUrl: string

  @prop({ default: false })
  public isAdmin: string

  @prop()
  public provider: UserProvider

  @prop()
  public settings: UserSettings

  // @prop({ ref: () => PlayerStats })
  // public playerStatsId: typegoose.Ref<PlayerStats>

  // @prop({ ref: () => PlayerCollection })
  // public collectionId: typegoose.Ref<PlayerCollection>
}

export default User
