export interface NetworkResponse<T = any> {
  data?: T;
  menu_items?: any[];
  errors?: string[];
}

export declare class NetworkAdapter {
  get(endpoint: string, params?: Record<string, any>): Promise<NetworkResponse>;
  post(endpoint: string, data?: any): Promise<NetworkResponse>;
  put(endpoint: string, data?: any, options?: any): Promise<NetworkResponse>;
  delete(endpoint: string, data?: any): Promise<NetworkResponse>;
  patch(endpoint: string, data?: any): Promise<NetworkResponse>;
}

export declare const networkAdapter: NetworkAdapter;