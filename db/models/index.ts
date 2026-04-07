import { getModelForClass } from '@typegoose/typegoose'
import User from './User'
import Topic from './Topic'
import Session from './Session'
import Recording from './Recording'

export const UserModel = getModelForClass(User)
export const TopicModel = getModelForClass(Topic)
export const SessionModel = getModelForClass(Session)
export const RecordingModel = getModelForClass(Recording)
