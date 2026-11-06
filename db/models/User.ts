import { modelOptions, prop } from '@typegoose/typegoose'
import { defaultAvatarImg } from '@/util/constants'

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false },  options: { customName: 'UserAvatars' } })
export class UserAvatars {
  @prop()
  public avatarSvg?: string

  @prop()
  public seed?: string
}

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false },  options: { customName: 'UserLibrary' } })
export class UserLibrary {
  @prop()
  public userAvatars?: UserAvatars[]
}

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false },  options: { customName: 'UserProvider' } })
export class UserProvider {
  @prop()
  public name?: string

  @prop()
  public providerId?: string
}

@modelOptions({ schemaOptions: { versionKey: false, timestamps: false, _id: false },  options: { customName: 'UserSettings' } })
export class UserSettings {
  @prop({ default: 60 })
  public defaultTimer?: number

  @prop({ default: false })
  public autofillSessionName?: boolean

  @prop({ default: false })
  public replaceTopicOnTimeout?: boolean

  @prop({ default: false })
  public allowOvertime?: boolean
}

export const DEFAULT_USER_SETTINGS = {
  defaultTimer: 60,
  autofillSessionName: false,
  replaceTopicOnTimeout: false,
  allowOvertime: false,
} as const

@modelOptions({ schemaOptions: { collection: 'User', versionKey: false, timestamps: true },  options: { customName: 'User' } })
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

  @prop({ type: () => UserSettings, _id: false, default: () => ({ ...DEFAULT_USER_SETTINGS }) })
  public settings: UserSettings

  @prop({ type: () => UserLibrary, _id: false, default: () => ({ userAvatars: [] }) })
  public library: UserLibrary

  // @prop({ ref: () => PlayerStats })
  // public playerStatsId: typegoose.Ref<PlayerStats>

  // @prop({ ref: () => PlayerCollection })
  // public collectionId: typegoose.Ref<PlayerCollection>
}

export default User
