type Persistence = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

export const persistence: Persistence = {
  setItem(key, value) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  getItem(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  removeItem(key) {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
  clear() {
    localStorage.clear();
    return Promise.resolve();
  },
};