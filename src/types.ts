export type Reducer<S, A> = (state: S, action: A) => S;
export type Listener = () => void;
export type Unsubscribe = () => void;