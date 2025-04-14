import type {
  IAudioBackend,
  ParameterType,
  ParameterMap,
  SliderParameter,
  ToggleParameter,
  ComboBoxParameter
} from '@tonalflex/template-plugin';

import ParameterController from '@/backend/sushi/parameterController';
import type { ParameterIdentifier, ParameterInfo } from '@/proto/sushi/sushi_rpc';

export class SushiPluginBackend implements IAudioBackend {
  private paramCache: Record<string, ParameterIdentifier> = {};
  private processorParams: ParameterInfo[] = [];
  public ready: Promise<void>;

  constructor(
    private controller: ParameterController,
    private processorId: number
  ) {
    this.ready = this.initialize();
  }

  private async initialize() {
    const paramList = await this.controller.getProcessorParameters(this.processorId);
    console.log('param list: ', paramList.parameters);
    this.processorParams = paramList.parameters;
    for (const param of this.processorParams) {
      const id = {
        processorId: this.processorId,
        parameterId: param.id
      };
      this.paramCache[param.name] = id;
    }
  }

  getParameterState<T extends ParameterType>(name: string, type: T): ParameterMap[T] {
    const id = this.paramCache[name];
    if (!id) {
      console.warn(`Parameter '${name}' not found. Known parameters:`, Object.keys(this.paramCache));
      throw new Error(`Parameter '${name}' not found`);
    }

    const config = sushiMap[type];
    if (!config) throw new Error(`Unsupported parameter type: ${type}`);

    return config.adapt(id, this.controller, this.processorParams) as ParameterMap[T];
  }

  getPluginFunction(name: string): (..._args: unknown[]) => Promise<unknown> {
    return async () => {
      console.warn(`SushiPluginBackend: No generic plugin function "${name}" implemented.`);
      return Promise.resolve();
    };
  }
}

const sushiMap: {
  [K in ParameterType]: {
    adapt: (
      id: ParameterIdentifier,
      controller: ParameterController,
      allParams: ParameterInfo[]
    ) => ParameterMap[K];
  };
} = {
  slider: {
    adapt: (id, controller): SliderParameter => ({
      getValue: () => {
        let value = 0;
        controller.getParameterValue(id).then(v => value = v);
        return value;
      },
      setValue: (value: number) => {
        controller.setParameterValue(id.processorId, id.parameterId, value);
      },
      valueChangedEvent: {
        addListener: () => {
          console.warn('Slider listener not supported yet');
          return -1;
        },
        removeListener: () => {}
      }
    })
  },
  toggle: {
    adapt: (id, controller): ToggleParameter => ({
      getValue: () => {
        let value = 0;
        controller.getParameterValue(id).then(v => value = v);
        return value > 0.5;
      },
      setValue: (value: boolean) => {
        controller.setParameterValue(id.processorId, id.parameterId, value ? 1 : 0);
      },
      valueChangedEvent: {
        addListener: () => {
          console.warn('Toggle listener not supported yet');
          return -1;
        },
        removeListener: () => {}
      }
    })
  },
  comboBox: {
    adapt: (id, controller, params): ComboBoxParameter => {
      const param = params.find(p => p.id === id.parameterId);
      const max = param?.maxDomainValue ?? 0;
      const choices = Array.from({ length: Math.round(max) + 1 }, (_, i) => `Option ${i}`);

      return {
        getChoiceIndex: () => {
          let value = 0;
          controller.getParameterValue(id).then(v => value = Math.floor(v));
          return value;
        },
        setChoiceIndex: (index: number) => {
          controller.setParameterValue(id.processorId, id.parameterId, index);
        },
        getChoices: () => choices,
        valueChangedEvent: {
          addListener: () => {
            console.warn('ComboBox listener not supported yet');
            return -1;
          },
          removeListener: () => {}
        }
      };
    }
  }
};
