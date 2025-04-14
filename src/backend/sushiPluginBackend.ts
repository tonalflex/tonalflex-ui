// src/backend/SushiPluginBackend.ts
import type {
  IAudioBackend,
  ParameterType,
  ParameterMap,
  SliderParameter,
  ToggleParameter,
  ComboBoxParameter
} from '@tonalflex/template-plugin';

import ParameterController from "@/backend/sushi/parameterController";
import type { ParameterIdentifier } from '@/proto/sushi/sushi_rpc';

export class SushiPluginBackend implements IAudioBackend {
  constructor(
    private controller: ParameterController,
    private processorId: number
  ) {}

  getParameterState<T extends ParameterType>(
    name: string,
    type: T
  ): ParameterMap[T] {
    const config = sushiMap[type];
    if (!config) throw new Error(`Unsupported parameter type: ${type}`);
    return config.adapt(() => this.getParamId(name), this.controller, this.processorId);
  }

  getPluginFunction(name: string): (...args: unknown[]) => Promise<unknown> {
    return async () => {
      console.warn(`SushiPluginBackend: No generic plugin function "${name}" implemented.`);
      return Promise.resolve();
    };
  }

  private async getParamId(name: string): Promise<ParameterIdentifier> {
    return await this.controller.getParameterId({
      processor: { id: this.processorId },
      parameterName: name
    });
  }
}

// Helpers to adapt Sushi param states into the frontend format

type SushiGetterMap = {
  [K in ParameterType]: {
    adapt: (
      getParamId: () => Promise<ParameterIdentifier>,
      controller: ParameterController,
      processorId: number
    ) => ParameterMap[K];
  };
};

const sushiMap: SushiGetterMap = {
  slider: {
    adapt: (getParamId, controller): SliderParameter => {
      let cachedValue = 0;

      // Populate cache
      getParamId().then(id => {
        controller.getParameterValue(id).then(val => {
          cachedValue = val;
        });
      });

      return {
        getValue: () => cachedValue,
        setValue: async (value: number) => {
          const id = await getParamId();
          await controller.setParameterValue(id.processorId, id.parameterId, value);
          cachedValue = value;
        },
        valueChangedEvent: {
          addListener: () => {
            console.warn('Slider listener not supported yet');
            return -1;
          },
          removeListener: () => {}
        }
      };
    }
  },
  toggle: {
    adapt: (getParamId, controller): ToggleParameter => {
      let cachedValue = false;

      getParamId().then(id => {
        controller.getParameterValue(id).then(val => {
          cachedValue = val > 0.5;
        });
      });

      return {
        getValue: () => cachedValue,
        setValue: async (value: boolean) => {
          const id = await getParamId();
          await controller.setParameterValue(id.processorId, id.parameterId, value ? 1.0 : 0.0);
          cachedValue = value;
        },
        valueChangedEvent: {
          addListener: () => {
            console.warn('Toggle listener not supported yet');
            return -1;
          },
          removeListener: () => {}
        }
      };
    }
  },
  comboBox: {
    adapt: (getParamId, controller): ComboBoxParameter => {
      let cachedIndex = 0;
      let cachedChoices: string[] = [];
  
      // Populate cache
      (async () => {
        const id = await getParamId();
        cachedIndex = Math.floor(await controller.getParameterValue(id));
  
        cachedChoices = []; // Temporary fix!!!!
      })();
  
      return {
        getChoiceIndex: () => cachedIndex,
        setChoiceIndex: async (index: number) => {
          const id = await getParamId();
          await controller.setParameterValue(id.processorId, id.parameterId, index);
          cachedIndex = index;
        },
        getChoices: () => cachedChoices,
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
