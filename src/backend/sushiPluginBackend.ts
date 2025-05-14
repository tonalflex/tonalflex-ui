import type {
  IAudioBackend,
  ParameterType,
  ParameterMap,
  SliderParameter,
  ToggleParameter,
  ComboBoxParameter,
} from '@tonalflex/template-plugin';
import ParameterController from '@/backend/sushi/parameterController';
import { ensureProcessorSubscription, removeProcessorSubscription } from '@/backend/parameterSubscriptionService';
import type { ParameterIdentifier, ParameterInfo } from '@/proto/sushi/sushi_rpc';

export class SushiPluginBackend implements IAudioBackend {
  private processorParams: ParameterInfo[] = [];
  private subscriptionEntry!: Awaited<ReturnType<typeof ensureProcessorSubscription>>;
  public ready: Promise<void>;

  constructor(
    private controller: ParameterController,
    private processorId: number,
    private listFiles: (folder: string) => Promise<string[]>
  ) {
    this.ready = this.initialize();
  }

  private async initialize() {
    this.subscriptionEntry = await ensureProcessorSubscription(this.processorId);
    this.processorParams = this.subscriptionEntry.paramInfo;
  }

  getPluginFunction(name: string): (...args: unknown[]) => Promise<unknown> {
    switch (name) {
      case "getModelChoices":
        return async () => {
          const files = await this.listFiles("/home/mind/NAM");
          return [
            "Select model...",
            ...files.filter(f => f.toLowerCase().endsWith(".nam"))
          ];
        };
      case "getIRChoices":
        return async () => {
          const files = await this.listFiles("/home/mind/IR");
          return [
            "Select IR...",
            ...files.filter(f => f.toLowerCase().endsWith(".wav"))
          ];
        };
      default:
        return async () => {
          console.warn(`Plugin function '${name}' not implemented for processor ${this.processorId}`);
          throw new Error(`Function '${name}' not supported`);
        };
    }
  }

  getParameterState<T extends ParameterType>(paramName: string, type: T): ParameterMap[T] {
    const param = this.processorParams.find(p => p.name === paramName);
    if (!param) throw new Error(`Parameter '${paramName}' not found on processor ${this.processorId}`);

    const id: ParameterIdentifier = {
      processorId: this.processorId,
      parameterId: param.id,
    };

    const config = sushiMap[type];
    if (!config) throw new Error(`Unknown parameter type: '${type}'`);

    if (type === 'comboBox' && param.maxDomainValue == null) {
      throw new Error(`Parameter '${paramName}' is not a valid comboBox`);
    }
    if (type === 'toggle' && (param.minDomainValue !== 0 || param.maxDomainValue !== 1)) {
      throw new Error(`Parameter '${paramName}' is not a valid toggle`);
    }

    return config.adapt(id, this.controller, this.subscriptionEntry, this.processorParams) as ParameterMap[T];
  }

  destroy() {
    removeProcessorSubscription(this.processorId);
  }
}

const sushiMap: {
  [K in ParameterType]: {
    adapt: (
      id: ParameterIdentifier,
      controller: ParameterController,
      subscriptionEntry: Awaited<ReturnType<typeof ensureProcessorSubscription>>,
      params: ParameterInfo[]
    ) => ParameterMap[K];
  };
} = {
  slider: {
    adapt: (id, controller, sub): SliderParameter => {
      const key = `${id.processorId}:${id.parameterId}`;
      const listeners = new Map<number, (val: number) => void>();
      let idCounter = 0;

      return {
        getValue: () => sub.cache.get(key) ?? 0,
        setValue: (value: number) => {
          console.log(`[✍️ Slider.setValue] ${key} → ${value}`);
          controller.setParameterValue(id.processorId, id.parameterId, value);
        },
        valueChangedEvent: {
          addListener: (listener) => {
            if (!sub.listeners.has(key)) sub.listeners.set(key, new Set());
            sub.listeners.get(key)?.add(listener);
            const id = idCounter++;
            listeners.set(id, listener);
            return id;
          },
          removeListener: (id) => {
            const listener = listeners.get(id);
            if (listener) {
              sub.listeners.get(key)?.delete(listener);
              listeners.delete(id);
            }
          }
        }
      };
    }
  },
  toggle: {
    adapt: (id, controller, sub): ToggleParameter => {
      const key = `${id.processorId}:${id.parameterId}`;
      const listeners = new Map<number, (val: boolean) => void>();
      const wrapperMap = new Map<number, (n: number) => void>();
      let idCounter = 0;

      return {
        getValue: () => (sub.cache.get(key) ?? 0) > 0.5,
        setValue: (val: boolean) => controller.setParameterValue(id.processorId, id.parameterId, val ? 1 : 0),
        valueChangedEvent: {
          addListener: (listener) => {
            const wrapped = (v: number) => listener(v > 0.5);
            if (!sub.listeners.has(key)) sub.listeners.set(key, new Set());
            sub.listeners.get(key)?.add(wrapped);
            const id = idCounter++;
            listeners.set(id, listener);
            wrapperMap.set(id, wrapped);
            return id;
          },
          removeListener: (id) => {
            const wrapped = wrapperMap.get(id);
            if (wrapped) sub.listeners.get(key)?.delete(wrapped);
            listeners.delete(id);
            wrapperMap.delete(id);
          }
        }
      };
    }
  },
  comboBox: {
    adapt: (id, controller, sub, params): ComboBoxParameter => {
      const key = `${id.processorId}:${id.parameterId}`;
      const param = params.find(p => p.id === id.parameterId);
      const max = param?.maxDomainValue ?? 0;
      const label = param?.label ?? "Option";

      const choices = Array.from({ length: Math.round(max) + 1 }, (_, i) => `${label} ${i}`);
      const listeners = new Map<number, (val: number) => void>();
      let idCounter = 0;

      return {
        getChoiceIndex: () => Math.floor(sub.cache.get(key) ?? 0),
        setChoiceIndex: (index: number) => controller.setParameterValue(id.processorId, id.parameterId, index),
        getChoices: () => choices,
        valueChangedEvent: {
          addListener: (listener) => {
            if (!sub.listeners.has(key)) sub.listeners.set(key, new Set());
            sub.listeners.get(key)?.add(listener);
            const id = idCounter++;
            listeners.set(id, listener);
            return id;
          },
          removeListener: (id) => {
            const listener = listeners.get(id);
            if (listener) sub.listeners.get(key)?.delete(listener);
            listeners.delete(id);
          }
        }
      };
    }
  }
};
