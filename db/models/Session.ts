import * as typegoose from '@typegoose/typegoose'
import { modelOptions, prop } from '@typegoose/typegoose'

import User from './User'

@modelOptions({ schemaOptions: { collection: 'Session', versionKey: false, timestamps: true } })
class Session {
  @prop({ required: true })
  public name: string

  @prop({ ref: User })
  public userId: typegoose.Ref<User>
}

export default Session
