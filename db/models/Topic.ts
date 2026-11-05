import { modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { collection: 'Topic', versionKey: false, timestamps: true },  options: { customName: 'Topic' }})
class Topic {
  @prop()
  public name: string

  @prop()
  public image: string
}

export default Topic
