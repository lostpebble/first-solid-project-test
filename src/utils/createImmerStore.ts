import { Draft, enablePatches, produceWithPatches } from "immer";
import { createStore, produce } from "solid-js/store";
import { Signal } from "solid-js";

enablePatches();
type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined;

type TUpdater<T> = (draft: Draft<T>, original: T) => void;

interface IImmerStore<T> {
  state: T;
  update: (updater: TUpdater<T>) => void;
}

interface ISignals {
  [key: number | string]: {
    sig: Signal<any>;
  }
}

export function createImmerStore<T extends object>(
  initialValue: T extends NotWrappable ? never : T,
): IImmerStore<T> {
  const getInitialValue = () => initialValue;
  // let currentState = initialValue;

  const [state, setState] = createStore(initialValue);
  const signals: {};

  const update = (updater: TUpdater<T>) => {
    /*const [nextState, patches, inversePatches] = produceWithPatches(currentState, (s: Draft<T>) => {
      updater(s, currentState);
    });

    currentState = nextState;*/
    setState(produce())
  };

  const stateProxy = new Proxy(
    {},
    {
      get(target: {}, p: string | symbol, receiver: any): any {},
    },
  );

  return {
    state,
    update,
  };
}
