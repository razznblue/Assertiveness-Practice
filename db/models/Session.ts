import * as typegoose from '@typegoose/typegoose'
import { modelOptions, prop } from '@typegoose/typegoose'

import User from './User'

@modelOptions({ schemaOptions: { collection: 'Session', versionKey: false, timestamps: true } })
class Session {
  @prop({ required: true })
  public name: string

  @prop({ required: false })
  public topicName?: string

  @prop({ required: false, default: 60 })
  public timer?: number

  @prop({ ref: User })
  public userId: typegoose.Ref<User>
}

export default Session
