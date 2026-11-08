import { modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { collection: 'UnsplashImage', versionKey: false, timestamps: false },  options: { customName: 'UnsplashImage' }})
class UnsplashImage {
  @prop({ required: true })
  public photoId!: string

  @prop({ required: true })
  public imageUrl!: string

  @prop({ required: true })
  public photographerName!: string

  @prop({ required: true })
  public photographerUrl!: string

  @prop({ required: true })
  public photoUrl!: string
}

@modelOptions({ schemaOptions: { collection: 'Topic', versionKey: false, timestamps: true },  options: { customName: 'Topic' }})
class Topic {
  @prop()
  public name: string

  @prop()
  public image: string

  @prop({ type: () => UnsplashImage, _id: false })
  public unsplashImage: UnsplashImage
}

export default Topic
