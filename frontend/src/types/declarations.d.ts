declare module 'react-hook-form' {
  export function useForm<TFieldValues = any>(props?: any): any;
  export function useController(props?: any): any;
  export function useWatch(props?: any): any;
  export function useFormContext(): any;
  export function Controller(props?: any): any;
  export function FormProvider(props?: any): any;
  export type UseFormReturn<T = any> = any;
  export type SubmitHandler<T = any> = (data: T, event?: any) => void | Promise<void>;
  export type FieldValues = Record<string, any>;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any, schemaOptions?: any, resolverOptions?: any): any;
}
