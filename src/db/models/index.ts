import { getModelForClass } from '@typegoose/typegoose';
import { FeesCollectedEvent } from './FeesCollectedEvent';
import { ScanCursor } from './ScanCursor';

export const FeesCollectedEventModel = getModelForClass(FeesCollectedEvent);
export const ScanCursorModel = getModelForClass(ScanCursor);
