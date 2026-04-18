import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Unexpected error occurred.';
}

export interface ApiQueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useApiQuery<T>(
  loader: () => Promise<T>,
): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (errorValue: unknown) {
      setError(toErrorMessage(errorValue));
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
  };
}
