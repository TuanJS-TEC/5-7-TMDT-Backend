import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  vi: {
    appName: 'Car Marketplace',
    home: 'Khám phá',
    favorites: 'Yêu thích',
    profile: 'Tài khoản',
    seller: 'Tin của tôi',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    loading: 'Đang tải…',
    retry: 'Thử lại',
    empty: 'Không có dữ liệu',
    admin: 'Quản trị',
  },
  en: {
    appName: 'Car Marketplace',
    home: 'Explore',
    favorites: 'Favorites',
    profile: 'Profile',
    seller: 'My listings',
    login: 'Sign in',
    register: 'Sign up',
    logout: 'Sign out',
    loading: 'Loading…',
    retry: 'Retry',
    empty: 'No data',
    admin: 'Admin',
  },
};

const i18n = new I18n(translations);
const locale = getLocales()[0]?.languageCode ?? 'vi';
i18n.locale = locale in translations ? locale : 'vi';
i18n.enableFallback = true;
i18n.defaultLocale = 'vi';

export function t(key: keyof typeof translations.vi): string {
  return i18n.t(key);
}

export default i18n;
