import * as typegoose from '@typegoose/typegoose'
import { modelOptions, prop } from '@typegoose/typegoose'

import Session from './Session'
import User from './User'

@modelOptions({
  schemaOptions: {
    collection: 'Recording',
    versionKey: false,
    timestamps: true,
  },
  options: {
    customName: 'Recording',
  },
})
class Recording {
  @prop({ required: true })
  public recordingId: string // S3 Storage Key

  @prop({ required: true })
  public recordingUrl: string

  @prop({ ref: Session })
  public sessionId: typegoose.Ref<Session>

  @prop({ ref: User })
  public userId: typegoose.Ref<User>

  @prop()
  public duration: number

  @prop()
  public fileSize: number

  @prop({ required: false, min: 0, max: 5 })
  public rating?: number // 0-5 with 0.5 increments (e.g., 4.5)
}

export default Recording
