import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const useAxios = (
  url: string,
  method = "GET",
  payload = null,
  headers = {},
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(new AbortController());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios({
        method: method.toUpperCase(),
        url,
        data: payload,
        headers,
        signal: controllerRef.current.signal,
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        }
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method, payload, headers]);

  useEffect(() => {
    fetchData();

    return () => {
      controllerRef.current.abort();
      controllerRef.current = new AbortController();
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export default useAxios;
