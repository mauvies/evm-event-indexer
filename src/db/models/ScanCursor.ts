import { index, modelOptions, prop } from '@typegoose/typegoose';

@index({ chainId: 1, contractAddress: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'scan_cursors',
    timestamps: true,
  },
})
export class ScanCursor {
  @prop({ type: () => Number, required: true })
  public chainId!: number;

  @prop({ type: () => String, required: true })
  public contractAddress!: string;

  @prop({ type: () => Number, required: true })
  public startBlock!: number;

  @prop({ type: () => Number, required: true })
  public lastBlock!: number;
}
