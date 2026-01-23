// Helper to manage tokens in localStorage and cookies
export class TokenManager {
  static setTokens(accessToken: string, refreshToken: string) {
    // Store in localStorage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Also set cookies for server-side access
    this.setCookie('access_token', accessToken, 1); // 1 day
    this.setCookie('refresh_token', refreshToken, 30); // 30 days
  }
  
  static getAccessToken(): string | null {
    // Try localStorage first
    const token = localStorage.getItem('access_token');
    if (token) return token;
    
    // Fallback to cookie
    return this.getCookie('access_token');
  }
  
  static getRefreshToken(): string | null {
    const token = localStorage.getItem('refresh_token');
    if (token) return token;
    return this.getCookie('refresh_token');
  }
  
  static clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.deleteCookie('access_token');
    this.deleteCookie('refresh_token');
  }
  
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
  
  private static setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  }
  
  private static getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }
  
  private static deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}