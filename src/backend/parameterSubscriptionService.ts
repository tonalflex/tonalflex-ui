import {
  ParameterUpdate,
  ParameterInfo,
  ParameterIdentifier,
} from '@/proto/sushi/sushi_rpc';
import NotificationController from '@/backend/sushi/notificationController';
import ParameterController from '@/backend/sushi/parameterController';
import { BASE_URL } from '@/backend/baseUrl'

export type ParamListener = (value: number) => void;

const notificationController = new NotificationController(BASE_URL + "/sushi");
const parameterController = new ParameterController(BASE_URL + "/sushi");

const subscriptionMap = new Map<
  number,
  {
    remove: () => void;
    listeners: Map<string, Set<ParamListener>>;
    cache: Map<string, number>;
    paramInfo: ParameterInfo[];
  }
>();

function paramNameFromId(id: ParameterIdentifier): string {
  return `${id.processorId}:${id.parameterId}`;
}

export async function ensureProcessorSubscription(processorId: number) {
  if (subscriptionMap.has(processorId)) {
    console.log(`[PSS Subscription] Already exists for processor ${processorId}`);
    return subscriptionMap.get(processorId)!;
  }

  const listeners = new Map<string, Set<ParamListener>>();
  const cache = new Map<string, number>();

  const unsubscribe = notificationController.subscribeToParameterUpdates(
    { parameters: [] },
    (update: ParameterUpdate) => {
      const id = update.parameter;
      if (!id || id.processorId !== processorId) return;

      const key = paramNameFromId(id);
      console.log(`[PSS ParamUpdate] ${key} = ${update.domainValue}`);
      cache.set(key, update.domainValue);

      const fns = listeners.get(key);
      if (fns) {
        console.log(`[PSS Notifying ${fns.size} listener(s) for ${key}]`);
        for (const fn of fns) fn(update.domainValue);
      } else {
        console.warn(`[PSS No listeners found for ${key}]`);
      }
    },
    (err) => {
      console.error(`[PSS SushiSubscription ERROR processor ${processorId}]`, err);
    }
  );

  const paramList = await parameterController.getProcessorParameters(processorId);
  const paramInfo = paramList.parameters;

  for (const param of paramInfo) {
    const key = `${processorId}:${param.id}`;
    try {
      const value = await parameterController.getParameterValue({
        processorId,
        parameterId: param.id,
      });
      cache.set(key, value);
      console.log(`[PSS Seeded cache] ${key} =`, value);
    } catch (err) {
      console.warn(`[PSS Failed to seed param ${param.name} (${param.id})]`, err);
    }
  }

  console.log(`[PSS Param Info] processor ${processorId}:`, paramInfo.map(p => ({
    name: p.name,
    id: p.id,
    min: p.minDomainValue,
    max: p.maxDomainValue,
  })));

  const entry = { remove: unsubscribe, listeners, cache, paramInfo };
  subscriptionMap.set(processorId, entry);

  return entry;
}

export function removeProcessorSubscription(processorId: number): void {
  const entry = subscriptionMap.get(processorId);
  if (entry) {
    entry.remove();
    subscriptionMap.delete(processorId);
    console.log(`[PSS Removed subscription for processor ${processorId}]`);
  }
}