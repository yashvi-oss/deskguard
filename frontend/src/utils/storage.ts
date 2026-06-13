export const getToken = (): string | null => localStorage.getItem('token');

export const setToken = (token: string): void => localStorage.setItem('token', token);

export const removeToken = (): void => localStorage.removeItem('token');

export const getUser = (): string | null => localStorage.getItem('user');

export const setUser = (user: string): void => localStorage.setItem('user', user);

export const removeUser = (): void => localStorage.removeItem('user');

export const clearStorage = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
