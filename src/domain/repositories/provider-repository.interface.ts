import { ProviderConfig } from '../../core/types/chat';

export interface IProviderRepository {
  getProviders(): Promise<ProviderConfig[]>;
  getProviderById(id: string): Promise<ProviderConfig | null>;
  updateProviderConfig(config: ProviderConfig): Promise<void>;
}
