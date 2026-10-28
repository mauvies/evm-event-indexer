import { index, modelOptions, prop } from '@typegoose/typegoose';

@index({ chainId: 1, txHash: 1, logIndex: 1 }, { unique: true })
// _id is added for properly sorting in pagination when multiple
// events share the same chainId, integrator, and blockNumber
@index({ chainId: 1, integrator: 1, blockNumber: -1, _id: -1 })
@modelOptions({
  schemaOptions: {
    collection: 'fees_collected_events',
    timestamps: true,
  },
})
export class FeesCollectedEvent {
  @prop({ type: () => Number, required: true })
  public chainId!: number;

  @prop({ type: () => String, required: true })
  public txHash!: string;

  @prop({ type: () => Number, required: true })
  public logIndex!: number;

  @prop({ type: () => Number, required: true })
  public blockNumber!: number;

  @prop({ type: () => String, required: true })
  public blockHash!: string;

  @prop({ type: () => String, required: true })
  public token!: string;

  @prop({ type: () => String, required: true })
  public integrator!: string;

  @prop({ type: () => String, required: true })
  public integratorFee!: string;

  @prop({ type: () => String, required: true })
  public protocolFee!: string;
}
