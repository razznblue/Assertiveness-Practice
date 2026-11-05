import * as typegoose from '@typegoose/typegoose'
import { modelOptions, prop } from '@typegoose/typegoose'

import User from './User'
import Topic from './Topic'

@modelOptions({ schemaOptions: { collection: 'Session', versionKey: false, timestamps: true } })
class Session {
  @prop({ required: true, trim: true })
  public name: string

  @prop({ required: false })
  public topicName?: string

  @prop({ required: false, default: 60 })
  public timer?: number

  @prop({ ref: User })
  public userId: typegoose.Ref<User>

  @prop({ ref: Topic })
  public topicId: typegoose.Ref<Topic>

  @prop()
  public duration: number

  @prop({ default: 0 })
  public attemptCount: number

  @prop({ default: 'active' })
  public status: string // 'active' | 'completed' | 'abandoned'
}

export default Session
