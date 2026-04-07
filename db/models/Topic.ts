import { modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { collection: 'Topic', versionKey: false, timestamps: true } })
class Topic {
  @prop()
  public name: string

  @prop()
  public image: string
}

export default Topic
